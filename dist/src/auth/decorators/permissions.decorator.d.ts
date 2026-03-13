import { ACTION, RESOURCE } from '@prisma/client';
export type RequiredPermission = `${ACTION}:${RESOURCE}`;
export declare const PERMISSIONS_KEY = "permissions";
export declare const CheckPermissions: (...permissions: RequiredPermission[]) => import("@nestjs/common").CustomDecorator<string>;
