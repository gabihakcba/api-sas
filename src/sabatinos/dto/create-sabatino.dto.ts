import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
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

  @IsOptional()
  @IsInt()
  @Min(1)
  idEvento?: number;

}
