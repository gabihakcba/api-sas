import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SCOPES_KEY,
  ScopeAwareRequest,
  ScopeConstraint,
} from '../decorators/scopes.decorator';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../types/auth-request.types';
import { hasUnrestrictedAccess } from '../utils/unrestricted-access.util';

interface RequestContainer {
  [key: string]: unknown;
}

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const constraints =
      this.reflector.getAllAndOverride<ScopeConstraint[]>(SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & ScopeAwareRequest>();

    request.scopeConstraints = constraints;

    if (constraints.length === 0) {
      return true;
    }

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'No se pudo resolver la identidad del usuario.',
      );
    }

    if (this.hasBypassAccess(user)) {
      return true;
    }

    for (const constraint of constraints) {
      const rawValue = this.readValueFromRequest(request, constraint);

      if (rawValue == null) {
        if (constraint.optional) {
          continue;
        }

        throw new ForbiddenException(
          `No se encontro el campo ${constraint.field} para validar el scope.`,
        );
      }

      const targetId = Number(rawValue);

      if (!Number.isInteger(targetId) || targetId <= 0) {
        throw new ForbiddenException(
          `El campo ${constraint.field} no contiene un identificador valido para scope.`,
        );
      }

      const resolvedScopeId = await this.resolveScopeId(constraint, targetId);

      if (
        user.scopes.some(
          (scope) =>
            scope.scopeType === constraint.scopeType &&
            scope.scopeId != null &&
            scope.scopeId === resolvedScopeId,
        )
      ) {
        return true;
      }
    }

    throw new ForbiddenException(
      'El usuario no posee un scope valido para esta operacion.',
    );
  }

  private hasBypassAccess(user: AuthenticatedUser): boolean {
    return hasUnrestrictedAccess(user);
  }

  private readValueFromRequest(
    request: AuthenticatedRequest,
    constraint: ScopeConstraint,
  ): unknown {
    const source = constraint.source ?? 'body';
    const container = request[source] as RequestContainer | undefined;

    return container?.[constraint.field];
  }

  private async resolveScopeId(
    constraint: ScopeConstraint,
    targetId: number,
  ): Promise<number> {
    if (constraint.entity === 'AREA') {
      const area = await this.prisma.area.findFirst({
        where: {
          id: targetId,
          borrado: false,
        },
        select: { id: true },
      });

      if (!area) {
        throw new ForbiddenException(
          'El area indicada para el scope no existe.',
        );
      }

      return area.id;
    }

    const rama = await this.prisma.rama.findFirst({
      where: {
        id: targetId,
        borrado: false,
      },
      select: {
        id: true,
        id_area: true,
      },
    });

    if (!rama) {
      throw new ForbiddenException('La rama indicada para el scope no existe.');
    }

    return constraint.scopeType === SCOPE.AREA ? rama.id_area : rama.id;
  }
}
