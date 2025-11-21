import { SetMetadata } from '@nestjs/common';
import { ACTION, RESOURCE } from '@prisma/client';

export const PERMISSION_KEY = 'permission';

export interface RequiredPermission {
  action: ACTION;
  resource: RESOURCE;
}

export const RequirePermission = (action: ACTION, resource: RESOURCE) =>
  SetMetadata(PERMISSION_KEY, { action, resource });
