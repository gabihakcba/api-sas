import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCuentaMiembroDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  user: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  apellidos: string;

  @IsString()
  @MinLength(7)
  @MaxLength(20)
  dni: string;

  @Type(() => Date)
  @IsDate()
  fechaNacimiento: Date;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  direccion: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  telefonoEmergencia: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  totem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cualidad?: string;
}
