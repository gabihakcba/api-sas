import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMovimientoCuentaAdjuntoDto } from './create-movimiento-cuenta.dto';

export class CreateMovimientoCuentaAdjuntosDto {
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateMovimientoCuentaAdjuntoDto)
  adjuntos: CreateMovimientoCuentaAdjuntoDto[];
}
