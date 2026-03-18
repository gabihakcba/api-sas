import { SCOPE } from '@prisma/client';
import {
  AuthenticatedScope,
  AuthenticatedUser,
} from '../types/auth-request.types';

const ALWAYS_UNRESTRICTED_ROLES = new Set(['OWN']);

const GROUP_UNRESTRICTED_ROLES = new Set([
  'ADM',
  'DEV',
  'AYUDANTE',
  'JEFATURA',
  'INTENDENCIA',
  'SECRETARIA_TESORERIA',
]);

const GROUP_UNRESTRICTED_SCOPE_TYPES = new Set<SCOPE>([
  SCOPE.GRUPO,
  SCOPE.GLOBAL,
]);
const ALWAYS_UNRESTRICTED_SCOPE_TYPES = new Set<SCOPE>([
  SCOPE.OWN,
  SCOPE.GLOBAL,
]);

export const hasScopedRoleAccess = (
  user: Pick<AuthenticatedUser, 'scopes'>,
  role: string,
  allowedScopeTypes: readonly SCOPE[],
): boolean =>
  user.scopes.some(
    (scope) =>
      scope.role === role && allowedScopeTypes.includes(scope.scopeType),
  );

export const hasUnrestrictedAccess = (
  user: Pick<AuthenticatedUser, 'scopes'>,
): boolean =>
  user.scopes.some((scope: AuthenticatedScope) => {
    if (ALWAYS_UNRESTRICTED_ROLES.has(scope.role)) {
      return ALWAYS_UNRESTRICTED_SCOPE_TYPES.has(scope.scopeType);
    }

    if (GROUP_UNRESTRICTED_ROLES.has(scope.role)) {
      return GROUP_UNRESTRICTED_SCOPE_TYPES.has(scope.scopeType);
    }

    return false;
  });
