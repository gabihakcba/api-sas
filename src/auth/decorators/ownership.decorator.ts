import { SetMetadata } from '@nestjs/common';
import { OWNERSHIP_KEY } from 'src/constans/key-decorators';

export type OwnershipEntity = 'cuenta' | 'miembro' | 'protagonista';
export type OwnershipSource = 'params' | 'body' | 'query';

export interface OwnershipRequirement {
  entity: OwnershipEntity;
  param: string;
  sources?: OwnershipSource[];
  allowSelf?: boolean;
  allowDependents?: boolean;
}

export const Ownership = (
  ...requirements: ReadonlyArray<OwnershipRequirement>
): MethodDecorator => SetMetadata(OWNERSHIP_KEY, requirements);
