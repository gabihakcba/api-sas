import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCuentaDineroDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoActual: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idArea?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idRama?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idMiembro?: number;
}
