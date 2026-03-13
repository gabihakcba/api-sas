import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePagoDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  detalles?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaPago?: Date;

  @IsInt()
  @Min(1)
  idCuentaDinero: number;

  @IsInt()
  @Min(1)
  idMetodoPago: number;

  @IsInt()
  @Min(1)
  idConceptoPago: number;

  @IsInt()
  @Min(1)
  idMiembro: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idCuentaOrigen?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idEvento?: number;
}
