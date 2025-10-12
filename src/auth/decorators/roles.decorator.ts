import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from 'src/constans/key-decorators';

export const Roles = (...roles: string[]) => {
  return SetMetadata(ROLES_KEY, roles);
};
