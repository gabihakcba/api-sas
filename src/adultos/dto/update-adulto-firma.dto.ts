import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAdultoFirmaDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  })
  @IsString()
  firmaBase64?: string | null;
}
