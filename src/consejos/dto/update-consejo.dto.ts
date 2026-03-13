import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateConsejoDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha?: Date;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  esOrdinario?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  horaInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  horaFin?: Date;
}
