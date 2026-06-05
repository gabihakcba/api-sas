import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePerfilPersonalDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  user?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  apellidos?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  dni?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  telefonoEmergencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  totem?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cualidad?: string | null;
}
