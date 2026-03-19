import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateConsejoModeradorDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? null
      : Number(value),
  )
  @IsInt()
  @Min(1)
  idModerador!: number | null;
}
