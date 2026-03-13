import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConsejoAsistenciaOptionsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
