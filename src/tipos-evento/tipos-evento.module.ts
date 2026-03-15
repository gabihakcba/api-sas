import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TiposEventoController } from './tipos-evento.controller';
import { TiposEventoService } from './tipos-evento.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TiposEventoController],
  providers: [TiposEventoService],
})
export class TiposEventoModule {}
