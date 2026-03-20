import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateMovimientoCuentaAdjuntoDto {
  @IsString()
  archivoBase64: string;

  @IsString()
  @MaxLength(255)
  mimeType: string;

  @IsString()
  @MaxLength(255)
  nombre: string;
}

export class CreateMovimientoCuentaDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  monto: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  detalles?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaMovimiento?: Date;

  @Type(() => Number)
  @IsNumber()
  idMetodoPago: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateMovimientoCuentaAdjuntoDto)
  adjuntos?: CreateMovimientoCuentaAdjuntoDto[];
}
