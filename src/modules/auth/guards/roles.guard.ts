import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { OWNERSHIP_KEY, ROLES_KEY } from 'src/common/constants/key-decorators';
import { ROLES } from 'src/common/constants/db/roles';
import { OwnershipRequirement } from '../decorators/ownership.decorator';
import { AuthAccountContext } from '../interfaces/auth-account-context.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    /**
     * Obtengo los roles requeridos
     */
    const rolesRequired = this.reflector.get<string[] | undefined>(
      ROLES_KEY,
      context.getHandler(),
    );

    /**
     * Para casos donde esta el decorador Public() no hay roles requeridos
     */
    const ownershipRequirements = this.reflector.get<
      OwnershipRequirement[] | undefined
    >(OWNERSHIP_KEY, context.getHandler());

    const hasRolesRequirement = Boolean(rolesRequired?.length);
    const hasOwnershipRequirement = Boolean(ownershipRequirements?.length);

    if (!hasRolesRequirement && !hasOwnershipRequirement) {
      return true;
    }

    /**
     * Obtengo los roles del usuario
     */
    const request = context.switchToHttp().getRequest<Request>();
    const roles = request['roles'] as string[] | undefined;
    const accountContext = request['accountContext'] as
      | AuthAccountContext
      | undefined;

    /**
     * Si el usuario no tiene roles denegado
     */
    if (!roles && hasRolesRequirement) {
      return false;
    }

    /**
     * Si el usuario pertenece a JEFATURA lo dejo pasar
     */
    if (roles?.some((role) => role === ROLES.JEFATURA)) {
      return true;
    }

    let roleSatisfied = !hasRolesRequirement;

    if (rolesRequired) {
      for (const role of rolesRequired) {
        if (role === ROLES.SELF) {
          if (
            this.validateSelfAccess(
              ownershipRequirements,
              request,
              accountContext,
            )
          ) {
            roleSatisfied = true;
            break;
          }
        } else if (roles?.includes(role)) {
          roleSatisfied = true;
          break;
        }
      }
    }

    if (!roleSatisfied) {
      return false;
    }

    if (hasOwnershipRequirement && ownershipRequirements) {
      return ownershipRequirements.every((requirement) =>
        this.validateOwnership(
          requirement,
          request,
          accountContext,
          roles ?? [],
        ),
      );
    }

    return true;
  }

  private validateSelfAccess(
    ownershipRequirements: OwnershipRequirement[] | undefined,
    request: Request,
    accountContext?: AuthAccountContext,
  ): boolean {
    if (accountContext) {
      if (!ownershipRequirements || ownershipRequirements.length === 0) {
        const idAsked = this.parseId(request.params?.['id']);
        return idAsked !== null && idAsked === accountContext.cuentaId;
      }

      return ownershipRequirements.some((requirement) => {
        if (requirement.allowSelf === false) {
          return false;
        }

        const targetId = this.extractTargetId(requirement, request);
        if (targetId === null) {
          return false;
        }

        switch (requirement.entity) {
          case 'cuenta':
            return targetId === accountContext.cuentaId;
          case 'miembro':
            return (
              accountContext.miembroId !== undefined &&
              targetId === accountContext.miembroId
            );
          case 'protagonista':
            return (
              accountContext.protagonistaId !== undefined &&
              targetId === accountContext.protagonistaId
            );
          default:
            return false;
        }
      });
    }

    const selfId = request['id'] as number | undefined;
    const idAsked = this.parseId(request.params?.['id']);
    return selfId !== undefined && idAsked !== null && idAsked === selfId;
  }

  private validateOwnership(
    requirement: OwnershipRequirement,
    request: Request,
    accountContext: AuthAccountContext | undefined,
    roles: string[],
  ): boolean {
    if (!accountContext) {
      return false;
    }

    const targetId = this.extractTargetId(requirement, request);
    if (targetId === null) {
      return false;
    }

    const allowSelf = requirement.allowSelf !== false;
    const allowDependents = requirement.allowDependents !== false;

    switch (requirement.entity) {
      case 'cuenta':
        if (allowSelf && targetId === accountContext.cuentaId) {
          return true;
        }

        if (
          allowDependents &&
          roles.includes(ROLES.RESPONSABLE) &&
          accountContext.dependents.some(
            (dependent) => dependent.cuentaId === targetId,
          )
        ) {
          return true;
        }

        return false;
      case 'miembro':
        if (
          allowSelf &&
          accountContext.miembroId !== undefined &&
          targetId === accountContext.miembroId
        ) {
          return true;
        }

        if (
          allowDependents &&
          roles.includes(ROLES.RESPONSABLE) &&
          accountContext.dependents.some(
            (dependent) => dependent.miembroId === targetId,
          )
        ) {
          return true;
        }

        return false;
      case 'protagonista':
        if (
          allowSelf &&
          accountContext.protagonistaId !== undefined &&
          targetId === accountContext.protagonistaId
        ) {
          return true;
        }

        if (
          allowDependents &&
          roles.includes(ROLES.RESPONSABLE) &&
          accountContext.dependents.some(
            (dependent) => dependent.protagonistaId === targetId,
          )
        ) {
          return true;
        }

        return false;
      default:
        return false;
    }
  }

  private extractTargetId(
    requirement: OwnershipRequirement,
    request: Request,
  ): number | null {
    const sources = requirement.sources?.length
      ? requirement.sources
      : (['params'] as const);

    for (const source of sources) {
      const container = this.getContainer(source, request);
      if (!container) {
        continue;
      }

      const value = container[requirement.param];
      const parsed = this.parseId(value);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }

  private getContainer(
    source: 'params' | 'body' | 'query',
    request: Request,
  ): Record<string, unknown> | undefined {
    switch (source) {
      case 'params':
        return request.params as Record<string, unknown> | undefined;
      case 'body':
        return this.isRecord(request.body) ? request.body : undefined;
      case 'query':
        return request.query as Record<string, unknown> | undefined;
      default:
        return undefined;
    }
  }

  private parseId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return null;
      }

      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
