import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

export const ROLES_KEY = 'acceptedRoles';
export const BYPASS_ROLES = ['ADM', 'OWN', 'JEFATURA'] as const;

export type BypassRole = (typeof BYPASS_ROLES)[number];
export type AcceptedRole = string;

export interface RoleAwareRequestUser {
  roles?: string[];
}

export interface RoleAwareRequest {
  user?: RoleAwareRequestUser;
  acceptedRoles?: AcceptedRole[];
}

export const Roles = <TRole extends readonly AcceptedRole[]>(...roles: TRole) =>
  SetMetadata(ROLES_KEY, [...roles]);

export const AcceptedRoles = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AcceptedRole[] => {
    const request = ctx.switchToHttp().getRequest<RoleAwareRequest>();
    return request.acceptedRoles ?? [];
  },
);
