import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TIPO_MOVIMIENTO_CUENTA } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MovimientosCuentaQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  idResponsable?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  idMetodoPago?: number;

  @IsOptional()
  @IsEnum(TIPO_MOVIMIENTO_CUENTA)
  tipo?: TIPO_MOVIMIENTO_CUENTA;
}
