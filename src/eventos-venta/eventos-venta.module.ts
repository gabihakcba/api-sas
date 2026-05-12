import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventosVentaController } from './eventos-venta.controller';
import { EventosVentaService } from './eventos-venta.service';

@Module({
  imports: [PrismaModule],
  controllers: [EventosVentaController],
  providers: [EventosVentaService],
})
export class EventosVentaModule {}
