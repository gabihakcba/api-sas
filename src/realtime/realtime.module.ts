import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsejoRealtimeGateway } from './consejo-realtime.gateway';
import { ConsejoRealtimeService } from './consejo-realtime.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
    }),
  ],
  providers: [ConsejoRealtimeService, ConsejoRealtimeGateway],
  exports: [ConsejoRealtimeService],
})
export class RealtimeModule {}
