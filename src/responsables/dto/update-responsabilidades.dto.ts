import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class UpdateResponsabilidadesDto {
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  protagonistaIds: number[];
}
