import { Module } from '@nestjs/common';
import { ProtagonistaService } from './protagonista.service';
import { ProtagonistaController } from './protagonista.controller';
import { CuentaModule } from 'src/modules/cuenta/cuenta.module';
import { PrismaModule } from 'src/modules/prisma/prisma.module';

@Module({
  imports: [CuentaModule, PrismaModule],
  controllers: [ProtagonistaController],
  providers: [ProtagonistaService],
})
export class ProtagonistaModule {}
