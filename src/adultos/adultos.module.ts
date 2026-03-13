import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CuentasModule } from '../cuentas/cuentas.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdultosController } from './adultos.controller';
import { AdultosService } from './adultos.service';

@Module({
  imports: [PrismaModule, CuentasModule, AuthModule],
  controllers: [AdultosController],
  providers: [AdultosService],
})
export class AdultosModule {}
