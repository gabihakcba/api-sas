import { Transform, Type } from 'class-transformer';
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
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return value === null ? null : undefined;
    }

    return Number(value);
  })
  @IsInt()
  @Min(1)
  idCuentaOrigen?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  idEvento?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined;
    }
    return value;
  })
  @IsString()
  comprobantePagoBase64?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined;
    }
    return value;
  })
  @IsString()
  @MaxLength(255)
  comprobantePagoMimeType?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined;
    }
    return value;
  })
  @IsString()
  @MaxLength(255)
  comprobantePagoNombre?: string | null;
}
