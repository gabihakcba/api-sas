import { IsArray, IsBoolean, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AsistenciaSabatinoItemDto {
  @IsInt()
  idMiembro: number;

  @IsBoolean()
  asistio: boolean;
}

export class SaveAsistenciaSabatinoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsistenciaSabatinoItemDto)
  asistencias: AsistenciaSabatinoItemDto[];
}
