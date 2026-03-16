import { IsOptional, IsString } from 'class-validator';

export class CreateAdjuntoFormacionDto {
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  archivoNombre!: string;

  @IsString()
  archivoMime!: string;

  @IsString()
  archivoBase64!: string;
}
