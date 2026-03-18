import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CiclosProgramaController } from './ciclos-programa.controller';
import { CiclosProgramaService } from './ciclos-programa.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CiclosProgramaController],
  providers: [CiclosProgramaService],
  exports: [CiclosProgramaService],
})
export class CiclosProgramaModule {}
