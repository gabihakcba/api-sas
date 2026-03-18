import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CuentasModule } from '../cuentas/cuentas.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PerfilesController } from './perfiles.controller';
import { PerfilesService } from './perfiles.service';

@Module({
  imports: [PrismaModule, AuthModule, CuentasModule],
  controllers: [PerfilesController],
  providers: [PerfilesService],
})
export class PerfilesModule {}
