import { IsString, MaxLength } from 'class-validator';

export class UpdateConfiguracionGrupoDto {
  @IsString()
  @MaxLength(120)
  nombreGrupo!: string;

  @IsString()
  @MaxLength(120)
  themeWeb!: string;

  @IsString()
  @MaxLength(120)
  themeMobile!: string;
}
