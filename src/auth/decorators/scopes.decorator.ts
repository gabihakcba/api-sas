import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
export const SCOPES_KEY = 'scopeConstraints';

export type ScopeTargetEntity = 'AREA' | 'RAMA';
export type ScopeValueSource = 'body' | 'params' | 'query';
export type SupportedScopedType = 'AREA' | 'RAMA';

export interface ScopeConstraint {
  scopeType: SupportedScopedType;
  entity: ScopeTargetEntity;
  field: string;
  source?: ScopeValueSource;
  optional?: boolean;
}

export interface ScopeAwareRequest {
  scopeConstraints?: ScopeConstraint[];
}

export const ScopeAccess = <TConstraint extends readonly ScopeConstraint[]>(
  ...constraints: TConstraint
) => SetMetadata(SCOPES_KEY, [...constraints]);

export const AcceptedScopes = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ScopeConstraint[] => {
    const request = ctx.switchToHttp().getRequest<ScopeAwareRequest>();
    return request.scopeConstraints ?? [];
  },
);
