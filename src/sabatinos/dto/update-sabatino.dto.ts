import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateSabatinoDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  titulo?: string;

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsArray()
  @IsOptional()
  educadorIds?: number[];

  @IsArray()
  @IsOptional()
  actividadIds?: Array<{
    actividadId: number;
    numero?: number;
    fecha?: string;
    responsableIds?: number[];
  }>;

  @IsArray()
  @IsOptional()
  ramaIds?: number[];

  @IsArray()
  @IsOptional()
  areaIds?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  idEvento?: number | null;

}
