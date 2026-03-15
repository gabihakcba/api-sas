import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateComisionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
