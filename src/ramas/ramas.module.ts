import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RamasController } from './ramas.controller';
import { RamasService } from './ramas.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RamasController],
  providers: [RamasService],
})
export class RamasModule {}
