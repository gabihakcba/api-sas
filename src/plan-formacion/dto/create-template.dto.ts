import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TIPO_COMPETENCIA_FORMACION } from '@prisma/client';

class TemplateResultadoDto {
  @IsString()
  descripcion!: string;
}

class TemplateAprendizajeDto {
  @IsString()
  descripcion!: string;

  @IsOptional()
  @IsBoolean()
  obligatoria?: boolean;
}

class TemplateComportamientoDto {
  @IsString()
  descripcion!: string;
}

class TemplateCompetenciaDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsEnum(TIPO_COMPETENCIA_FORMACION)
  tipo!: TIPO_COMPETENCIA_FORMACION;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComportamientoDto)
  comportamientos?: TemplateComportamientoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateAprendizajeDto)
  aprendizajes?: TemplateAprendizajeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateResultadoDto)
  resultados?: TemplateResultadoDto[];
}

class TemplateNivelDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orden!: number;

  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateCompetenciaDto)
  competencias!: TemplateCompetenciaDto[];
}

export class CreateTemplateDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  idArea!: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateNivelDto)
  niveles!: TemplateNivelDto[];
}

export { TemplateNivelDto, TemplateCompetenciaDto };
