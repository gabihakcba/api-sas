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

export class UpdatePagoDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  detalles?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaPago?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  idCuentaDinero?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idMetodoPago?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idConceptoPago?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idMiembro?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idCuentaOrigen?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idEvento?: number;
}
