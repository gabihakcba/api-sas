import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateMiembroDto } from 'src/miembro/dto/create-miembro.dto';

export class CreateProtagonistaDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id_rama: number;

  @IsOptional()
  @Transform((v) => {
    if (typeof v === 'string') {
      return v === 'true';
    } else return v;
  })
  es_becado: boolean = false;

  @IsOptional()
  @Transform((v) => {
    if (typeof v === 'string') {
      return v === 'true';
    } else return v;
  })
  @IsBoolean()
  activo: boolean = true;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateMiembroDto)
  miembro: CreateMiembroDto;
}
