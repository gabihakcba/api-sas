export declare const ROLES_KEY = "acceptedRoles";
export declare const BYPASS_ROLES: readonly ["ADM", "OWN", "JEFATURA"];
export type BypassRole = (typeof BYPASS_ROLES)[number];
export type AcceptedRole = string;
export interface RoleAwareRequestUser {
    roles?: string[];
}
export interface RoleAwareRequest {
    user?: RoleAwareRequestUser;
    acceptedRoles?: AcceptedRole[];
}
export declare const Roles: <TRole extends readonly AcceptedRole[]>(...roles: TRole) => import("@nestjs/common").CustomDecorator<string>;
export declare const AcceptedRoles: (...dataOrPipes: unknown[]) => ParameterDecorator;
