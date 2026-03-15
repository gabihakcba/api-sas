import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateEventoAfectacionesDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  areaIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ramaIds?: number[];
}
