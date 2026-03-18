import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AcceptedRole,
  ROLES_KEY,
} from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/auth-request.types';
import { hasUnrestrictedAccess } from '../utils/unrestricted-access.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<AcceptedRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.acceptedRoles = requiredRoles;

    if (requiredRoles.length === 0) {
      return true;
    }

    const userRoles = request.user?.roles ?? [];

    if (userRoles.length === 0) {
      throw new ForbiddenException('No tienes los roles necesarios');
    }

    const grantedRoles = new Set(userRoles);
    const hasBypassRole =
      request.user !== undefined && hasUnrestrictedAccess(request.user);

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
