import { SetMetadata } from '@nestjs/common';
import { ACTION, RESOURCE } from '@prisma/client';

export type RequiredPermission = `${ACTION}:${RESOURCE}`;

export const PERMISSIONS_KEY = 'permissions';
export const CheckPermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
