import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

const parseNullableNumber = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === '' ? null : Number(value);

export class UpdateConsejoSecretariaDto {
  @IsOptional()
  @Transform(parseNullableNumber)
  @IsInt()
  @Min(1)
  idSecretario!: number | null;

  @IsOptional()
  @Transform(parseNullableNumber)
  @IsInt()
  @Min(1)
  idProsecretario!: number | null;
}
