import { PartialType } from '@nestjs/mapped-types';
import { CreateRamaDto } from './create-rama.dto';

export class UpdateRamaDto extends PartialType(CreateRamaDto) {}
