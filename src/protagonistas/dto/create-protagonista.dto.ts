import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsOptional, Min } from 'class-validator';
import { CreateCuentaMiembroDto } from '../../cuentas/dto/create-cuenta-miembro.dto';

export class CreateProtagonistaDto extends CreateCuentaMiembroDto {
  @IsInt()
  @Min(1)
  idRama: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaIngresoRama?: Date;

  @IsOptional()
  @IsBoolean()
  esBecado?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
