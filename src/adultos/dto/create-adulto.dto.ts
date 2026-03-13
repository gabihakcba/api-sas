import { Type } from 'class-transformer';
import { SCOPE } from '@prisma/client';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { CreateCuentaMiembroDto } from '../../cuentas/dto/create-cuenta-miembro.dto';

export class CreateAdultoDto extends CreateCuentaMiembroDto {
  @IsInt()
  @Min(1)
  idArea: number;

  @IsInt()
  @Min(1)
  idPosicion: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idRama?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaInicioEquipo?: Date;

  @IsOptional()
  @IsBoolean()
  esBecado?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  idRole?: number;

  @IsOptional()
  @IsEnum(SCOPE)
  tipoScope?: SCOPE;

  @IsOptional()
  @IsInt()
  @Min(1)
  idScope?: number;
}
