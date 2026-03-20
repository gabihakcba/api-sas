import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSabatinoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsArray()
  @IsOptional()
  educadorIds?: number[];

  @IsArray()
  @IsOptional()
  actividadIds?: number[];

  @IsArray()
  @IsOptional()
  ramaIds?: number[];

  @IsArray()
  @IsOptional()
  areaIds?: number[];
}
