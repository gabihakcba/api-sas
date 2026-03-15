import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ComisionesController } from './comisiones.controller';
import { ComisionesService } from './comisiones.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ComisionesController],
  providers: [ComisionesService],
})
export class ComisionesModule {}
