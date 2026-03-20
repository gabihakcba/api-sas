import { PartialType } from '@nestjs/mapped-types';
import { CreateSabatinoDto } from './create-sabatino.dto';

export class UpdateSabatinoDto extends PartialType(CreateSabatinoDto) {}
