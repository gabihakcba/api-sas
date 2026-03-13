import { Type } from 'class-transformer';
import { SCOPE } from '@prisma/client';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAdultoDto {
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

  @IsOptional()
  @IsInt()
  @Min(1)
  idArea?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idPosicion?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idRama?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaInicioEquipo?: Date;

  @IsOptional()
  @IsBoolean()
  esBecado?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  idRole?: number;

  @IsOptional()
  @IsEnum(SCOPE)
  tipoScope?: SCOPE;

  @IsOptional()
  @IsInt()
  @Min(1)
  idScope?: number;
}
