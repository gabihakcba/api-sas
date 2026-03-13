import { SCOPE } from '@prisma/client';
import { ScopeConstraint } from '../decorators/scopes.decorator';
export interface AuthenticatedScope {
    role: string;
    scopeType: SCOPE;
    scopeId: number | null;
}
export interface AuthenticatedUser {
    userId: number;
    username: string;
    roles: string[];
    permissions: string[];
    scopes: AuthenticatedScope[];
}
export interface AuthenticatedRequest {
    user?: AuthenticatedUser;
    acceptedRoles?: string[];
    scopeConstraints?: ScopeConstraint[];
    body?: Record<string, unknown>;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
}
