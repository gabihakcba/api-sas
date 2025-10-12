import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CuentaService } from 'src/cuenta/cuenta.service';
import { ROLES_KEY } from 'src/constans/key-decorators';
import { ROLES } from 'src/constans/db/roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly cuentaService: CuentaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    if (!rolesRequired) {
      return true;
    }

    /**
     * Obtengo los roles del usuario
     */
    const request = context.switchToHttp().getRequest<Request>();
    const id = request['id'] as unknown as number;
    const roles = request['roles'] as string[] | undefined;

    /**
     * Si el usuario no tiene roles denegado
     */
    if (!roles) {
      return false;
    }

    /**
     * Si el usuario pertenece a JEFATURA lo dejo pasar
     */
    if (roles.some((role) => role === ROLES.JEFATURA)) {
      return true;
    }

    /**
     * Si roles requeridos es self y es el mismo deja pasar
     */
    const idAsked = Number(request.params['id']);
    if (rolesRequired.some((role) => role === ROLES.SELF)) {
      return idAsked === id;
    }

    return false;
  }
}
