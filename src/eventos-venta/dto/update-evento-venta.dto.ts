import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { EventoVentaCostoItemDto } from './evento-venta-costo-item.dto';

export class UpdateEventoVentaDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaEvento?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notas?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventoVentaCostoItemDto)
  costos?: EventoVentaCostoItemDto[];
}
