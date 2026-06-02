import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateEventoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
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
  @IsString()
  @MaxLength(255)
  lugar?: string;

  @IsOptional()
  @IsBoolean()
  terminado?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  costoMp?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  costoMa?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  costoAyudante?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idTipo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCicloPrograma?: number | null;

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
