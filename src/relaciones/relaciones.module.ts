import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RelacionesController } from './relaciones.controller';
import { RelacionesService } from './relaciones.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RelacionesController],
  providers: [RelacionesService],
})
export class RelacionesModule {}
