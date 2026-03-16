import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PlanFormacionController } from './plan-formacion.controller';
import { PlanFormacionService } from './plan-formacion.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlanFormacionController],
  providers: [PlanFormacionService],
  exports: [PlanFormacionService],
})
export class PlanFormacionModule {}
