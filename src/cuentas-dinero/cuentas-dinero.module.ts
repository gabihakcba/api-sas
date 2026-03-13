import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CuentasDineroController } from './cuentas-dinero.controller';
import { CuentasDineroService } from './cuentas-dinero.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CuentasDineroController],
  providers: [CuentasDineroService],
})
export class CuentasDineroModule {}
