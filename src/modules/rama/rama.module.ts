import { Module } from '@nestjs/common';
import { RamaService } from './rama.service';
import { RamaController } from './rama.controller';

@Module({
  controllers: [RamaController],
  providers: [RamaService],
})
export class RamaModule {}
