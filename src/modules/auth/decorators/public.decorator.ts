import { SetMetadata } from '@nestjs/common';
import { PUBLICK_KEY } from 'src/common/constants/key-decorators';

export const Public = () => {
  return SetMetadata(PUBLICK_KEY, true);
};
