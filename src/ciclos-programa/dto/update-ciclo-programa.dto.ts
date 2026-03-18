import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ESTADO_CICLO } from '@prisma/client';

export class UpdateCicloProgramaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaFin?: Date;

  @IsOptional()
  @IsEnum(ESTADO_CICLO)
  estado?: ESTADO_CICLO;

  @IsOptional()
  @IsString()
  diagnostico?: string;

  @IsOptional()
  @IsString()
  planificacion?: string;

  @IsOptional()
  @IsString()
  desarrollo?: string;

  @IsOptional()
  @IsString()
  evaluacion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idRama?: number;
}
