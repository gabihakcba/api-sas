import { SCOPE } from '@prisma/client';
import { Request } from 'express';
import { ScopeConstraint } from '../decorators/scopes.decorator';
import { AuditRequestContext } from '../../audit/audit.types';

export interface AuthenticatedScope {
  role: string;
  scopeType: SCOPE;
  scopeId: number | null;
}

export interface AuthenticatedUser {
  userId: number;
  username: string;
  memberId: number | null;
  roles: string[];
  permissions: string[];
  scopes: AuthenticatedScope[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  acceptedRoles?: string[];
  scopeConstraints?: ScopeConstraint[];
  audit?: AuditRequestContext;
}
