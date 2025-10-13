import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @Transform((value) => new String(value))
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
