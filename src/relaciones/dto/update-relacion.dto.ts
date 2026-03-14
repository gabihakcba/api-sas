import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateRelacionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
