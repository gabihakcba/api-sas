import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CiclosProgramaModule } from '../ciclos-programa/ciclos-programa.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SabatinosModule } from '../sabatinos/sabatinos.module';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';

@Module({
  imports: [PrismaModule, AuthModule, CiclosProgramaModule, SabatinosModule],
  controllers: [EventosController],
  providers: [EventosService],
})
export class EventosModule {}
