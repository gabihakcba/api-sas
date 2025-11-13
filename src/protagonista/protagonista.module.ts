import { Module } from '@nestjs/common';
import { ProtagonistaService } from './protagonista.service';
import { ProtagonistaController } from './protagonista.controller';
import { CuentaModule } from 'src/cuenta/cuenta.module';

@Module({
  imports: [CuentaModule],
  controllers: [ProtagonistaController],
  providers: [ProtagonistaService],
})
export class ProtagonistaModule {}
