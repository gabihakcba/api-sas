import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AcceptedRole,
  BYPASS_ROLES,
  ROLES_KEY,
  RoleAwareRequest,
} from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<AcceptedRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const request = context.switchToHttp().getRequest<RoleAwareRequest>();
    request.acceptedRoles = requiredRoles;

    if (requiredRoles.length === 0) {
      return true;
    }

    const userRoles = request.user?.roles ?? [];

    if (userRoles.length === 0) {
      throw new ForbiddenException('No tienes los roles necesarios');
    }

    const grantedRoles = new Set(userRoles);
    const hasBypassRole = BYPASS_ROLES.some((role) => grantedRoles.has(role));

    if (hasBypassRole) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => grantedRoles.has(role));

    if (!hasRole) {
      throw new ForbiddenException('No tienes los roles necesarios');
    }

    return true;
  }
}
