import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsejosController } from './consejos.controller';
import { ConsejosService } from './consejos.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ConsejosController],
  providers: [ConsejosService],
})
export class ConsejosModule {}
