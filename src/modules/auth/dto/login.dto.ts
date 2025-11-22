import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @Type(() => String)
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
