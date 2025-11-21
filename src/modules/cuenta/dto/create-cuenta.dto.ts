import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCuentaDto {
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
