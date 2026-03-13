import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConceptosPagoController } from './conceptos-pago.controller';
import { ConceptosPagoService } from './conceptos-pago.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ConceptosPagoController],
  providers: [ConceptosPagoService],
})
export class ConceptosPagoModule {}
