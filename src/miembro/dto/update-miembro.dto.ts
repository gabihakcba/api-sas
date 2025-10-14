import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { UpdateCuentaDto } from 'src/cuenta/dto/update-cuenta.dto';
import { CreateMiembroDto } from './create-miembro.dto';

class PartialMiembroDto extends PartialType(
  OmitType(CreateMiembroDto, ['cuenta'] as const),
) {}

export class UpdateMiembroDto extends PartialMiembroDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCuentaDto)
  cuenta?: UpdateCuentaDto;
}
