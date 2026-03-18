import { IsOptional, IsString } from 'class-validator';

export class UpdatePerfilFirmaDto {
  @IsOptional()
  @IsString()
  firmaBase64?: string | null;
}
