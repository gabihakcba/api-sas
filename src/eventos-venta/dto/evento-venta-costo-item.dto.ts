import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class EventoVentaCostoItemDto {
  @IsString()
  @MaxLength(160)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  unidadMedida?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  costoUnitarioX10000!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  cantidadX10000!: number;
}
