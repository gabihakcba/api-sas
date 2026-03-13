import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMetodoPagoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
