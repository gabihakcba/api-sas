import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AssignEventoComisionDto {
  @IsOptional()
  @Transform(({ value }) => (value === null || value === '' ? null : value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idComision?: number | null;
}
