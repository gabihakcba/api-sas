import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCuentaDto } from '../../cuenta/dto/create-cuenta.dto';

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
  fecha_nacimiento: string;

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

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateCuentaDto)
  cuenta: CreateCuentaDto;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id_rama: number;
}
