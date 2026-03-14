import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CuentasModule } from '../cuentas/cuentas.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ResponsablesController } from './responsables.controller';
import { ResponsablesService } from './responsables.service';

@Module({
  imports: [PrismaModule, CuentasModule, AuthModule],
  controllers: [ResponsablesController],
  providers: [ResponsablesService],
})
export class ResponsablesModule {}
