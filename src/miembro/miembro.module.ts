import { Module } from '@nestjs/common';
import { CuentaModule } from '../cuenta/cuenta.module';
import { MiembroService } from './miembro.service';

@Module({
  imports: [CuentaModule],
  providers: [MiembroService],
  exports: [MiembroService],
})
export class MiembroModule {}
