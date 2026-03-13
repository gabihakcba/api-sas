import { ESTADO_TEMARIO } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTemarioConsejoDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  debate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  acuerdo?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sinMp?: boolean;

  @IsOptional()
  @IsEnum(ESTADO_TEMARIO)
  estado?: ESTADO_TEMARIO;
}
