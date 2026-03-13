import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';

export class ProtagonistaPaseDto {
  @IsInt()
  @Min(1)
  idRama: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaIngresoRama?: Date;
}
