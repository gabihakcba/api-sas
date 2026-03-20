import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, ValidateNested } from 'class-validator';

class SabatinoActividadItemDto {
  @IsInt()
  actividadId: number;

  @IsInt()
  @IsOptional()
  numero?: number;

  @IsDateString()
  @IsOptional()
  fecha?: string;

  @IsArray()
  @IsOptional()
  responsableIds?: number[];
}

export class UpdateSabatinoActividadesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SabatinoActividadItemDto)
  actividades: SabatinoActividadItemDto[];
}
