import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
import {
  PERMISSION_KEY,
  RequiredPermission,
} from '../decorators/require-permission.decorator';
import { AuthTokenPayload } from '../../modules/auth/interfaces/auth-token-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthTokenPayload;

    if (!user || !user.roles) {
      return false;
    }

    // 1. Consultar qué roles tienen permiso para este ACTION + RESOURCE
    const rolesWithPermission = await this.prisma.rolePermission.findMany({
      where: {
        Permission: {
          action: requiredPermission.action,
          resource: requiredPermission.resource,
        },
      },
      select: {
        Role: {
          select: {
            nombre: true,
          },
        },
      },
    });

    const allowedRoleNames = rolesWithPermission.map((rp) => rp.Role.nombre);

    // 2. Filtrar los roles del usuario que coinciden con los permitidos
    const matchingUserRoles = user.roles.filter((userRole) =>
      allowedRoleNames.includes(userRole.name),
    );

    if (matchingUserRoles.length === 0) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    // 3. Validación de Scope
    // Si alguno es GLOBAL, acceso total
    const hasGlobal = matchingUserRoles.some(
      (r) => r.scope === 'GLOBAL',
    );

    if (hasGlobal) {
      return true;
    }

    // Si es RAMA u OWN, inyectamos el scopeId
    const scopeIds = matchingUserRoles
      .map((r) => r.scopeId)
      .filter((id): id is number => typeof id === 'number');

    if (scopeIds.length > 0) {
      // Inyectamos en el request para que el controlador/servicio lo use
      request['scopeIds'] = scopeIds;
      // Para compatibilidad simple, si hay uno solo, lo ponemos en scopeId
      if (scopeIds.length === 1) {
        request['scopeId'] = scopeIds[0];
      }
    }

    // 4. Validación de Scope OWN
    const hasOwn = matchingUserRoles.some((r) => r.scope === 'OWN');
    if (hasOwn) {
      request['useOwnScope'] = true;
    }

    return true;
  }
}
