import { Module } from '@nestjs/common';
import { MiembroService } from './miembro.service';
import { MiembroController } from './miembro.controller';

@Module({
  controllers: [MiembroController],
  providers: [MiembroService],
})
export class MiembroModule {}
