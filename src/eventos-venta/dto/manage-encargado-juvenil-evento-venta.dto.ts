import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ManageEncargadoJuvenilEventoVentaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMiembro!: number;
}
