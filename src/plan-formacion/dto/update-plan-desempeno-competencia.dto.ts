import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePlanDesempenoCompetenciaDto {
  @IsBoolean()
  validada!: boolean;

  @IsOptional()
  @IsString()
  observacionApf?: string;
}
