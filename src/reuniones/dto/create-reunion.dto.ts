import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MODALIDAD_REUNION } from '@prisma/client';

export class CreateReunionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  titulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @Type(() => Date)
  @IsDate()
  fechaInicio: Date;

  @Type(() => Date)
  @IsDate()
  fechaFin: Date;

  @IsOptional()
  @IsEnum(MODALIDAD_REUNION)
  modalidad?: MODALIDAD_REUNION;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lugarFisico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  urlVirtual?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  areaIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ramaIds?: number[];
}
