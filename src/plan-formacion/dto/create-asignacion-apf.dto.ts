import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAsignacionApfDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idAdulto!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  idConsejo!: number;

  @IsOptional()
  @IsString()
  observacion?: string;
}
