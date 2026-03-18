import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicConfigController } from './public-config.controller';
import { PublicConfigService } from './public-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicConfigController],
  providers: [PublicConfigService],
  exports: [PublicConfigService],
})
export class PublicConfigModule {}
