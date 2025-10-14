import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, ValidateNested } from 'class-validator';
import { UpdateCuentaDto } from 'src/cuenta/dto/update-cuenta.dto';
import { CreateMiembroDto } from './create-miembro.dto';

class PartialMiembroDto extends PartialType(
  OmitType(CreateMiembroDto, ['cuenta', 'fecha_nacimiento'] as const),
) {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha_nacimiento?: Date;
}

export class UpdateMiembroDto extends PartialMiembroDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCuentaDto)
  cuenta?: UpdateCuentaDto;
}
