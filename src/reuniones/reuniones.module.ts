import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReunionesController } from './reuniones.controller';
import { ReunionesService } from './reuniones.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReunionesController],
  providers: [ReunionesService],
})
export class ReunionesModule {}
