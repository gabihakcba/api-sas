import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMiembroDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  apellidos: string;

  @IsNotEmpty()
  @IsString()
  dni: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_nacimiento: Date;

  @IsNotEmpty()
  @IsString()
  direccion: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsNotEmpty()
  @IsString()
  telefono_emergencia: string;

  @IsOptional()
  @IsString()
  totem?: string;

  @IsOptional()
  @IsString()
  cualidad?: string;
}
