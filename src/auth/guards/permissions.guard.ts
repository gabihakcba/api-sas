import { ACTION } from '@prisma/client';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../types/auth-request.types';
import {
  PERMISSIONS_KEY,
  RequiredPermission,
} from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RequiredPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    if (!user || !user.permissions) {
      throw new ForbiddenException('No tienes permisos suficientes');
    }

    const grantedPermissions = new Set<string>(user.permissions);

    const hasPermission = requiredPermissions.every((permission) => {
      const [, resource] = permission.split(':');

      return (
        grantedPermissions.has(permission) ||
        grantedPermissions.has(`${ACTION.MANAGE}:${resource}`)
      );
    });

    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos suficientes');
    }

    return true;
  }
}
