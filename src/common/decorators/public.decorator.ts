import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/key-decorators';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
