import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ManageRepresentanteJuvenilDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMiembro!: number;
}
