import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateActividadDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  objetivos?: string;

  @IsString()
  @IsOptional()
  materiales?: string;

  @IsInt()
  id_tipo: number;

  @IsArray()
  @IsOptional()
  responsableIds?: number[];

  @IsInt()
  @IsOptional()
  id_sabatino?: number;

  @IsDateString()
  @IsOptional()
  fecha?: string;

  @IsInt()
  @IsOptional()
  numero?: number;
}
