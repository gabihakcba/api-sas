import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateResponsableDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  user?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
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
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefonoEmergencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  totem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cualidad?: string;
}
