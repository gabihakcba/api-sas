import { Module } from '@nestjs/common';
import { CuentaModule } from '../cuenta/cuenta.module';
import { MiembroService } from './miembro.service';
import { MiembroController } from './miembro.controller';

@Module({
  imports: [CuentaModule],
  controllers: [MiembroController],
  providers: [MiembroService],
})
export class MiembroModule {}
