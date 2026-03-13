import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CuentasModule } from '../cuentas/cuentas.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProtagonistasController } from './protagonistas.controller';
import { ProtagonistasService } from './protagonistas.service';

@Module({
  imports: [PrismaModule, CuentasModule, AuthModule],
  controllers: [ProtagonistasController],
  providers: [ProtagonistasService],
})
export class ProtagonistasModule {}
