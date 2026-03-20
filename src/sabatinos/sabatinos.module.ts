import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SabatinosController } from './sabatinos.controller';
import { SabatinosService } from './sabatinos.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SabatinosController],
  providers: [SabatinosService],
  exports: [SabatinosService],
})
export class SabatinosModule {}
