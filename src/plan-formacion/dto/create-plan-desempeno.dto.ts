import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDesempenoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPlanFormacionTemplate!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  idApfAdulto!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio!: number;

  @IsOptional()
  @IsString()
  observacionesGenerales?: string;
}
