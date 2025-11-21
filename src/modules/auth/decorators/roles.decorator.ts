import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from 'src/common/constants/key-decorators';

export const Roles = (...roles: string[]) => {
  return SetMetadata(ROLES_KEY, roles);
};
