import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const toOptionalString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class LogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(toOptionalString)
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(toOptionalString)
  @IsString()
  endpoint?: string;

  @IsOptional()
  @Transform(toOptionalString)
  @IsString()
  username?: string;

  @IsOptional()
  @Transform(toOptionalString)
  @IsString()
  tabla?: string;
}
