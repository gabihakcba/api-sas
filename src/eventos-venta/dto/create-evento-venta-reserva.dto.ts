import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEventoVentaReservaDto {
  @IsString()
  @MaxLength(160)
  comprador!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idVendedorMiembro?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  idItem!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idSector?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  efectivo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  transferencia?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cuenta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  debe?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  retiro?: number;
}
