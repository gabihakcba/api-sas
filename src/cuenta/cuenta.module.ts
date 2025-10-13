import { Module } from '@nestjs/common';
import { CuentaService } from './cuenta.service';
import { CuentaController } from './cuenta.controller';
import { CuentaRepository } from './cuenta.repository';

@Module({
  controllers: [CuentaController],
  providers: [CuentaService, CuentaRepository],
  exports: [CuentaService, CuentaRepository],
})
export class CuentaModule {}
