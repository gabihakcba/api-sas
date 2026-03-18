import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
