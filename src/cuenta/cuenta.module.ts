import { Module } from '@nestjs/common';
import { CuentaService } from './cuenta.service';

@Module({
  providers: [CuentaService],
  exports: [CuentaService],
})
export class CuentaModule {}
