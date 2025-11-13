import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CuentaModule } from './cuenta/cuenta.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { MiembroModule } from './miembro/miembro.module';
import { RamaModule } from './rama/rama.module';
import { ProtagonistaModule } from './protagonista/protagonista.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    CuentaModule,
    PrismaModule,
    AuthModule,
    MiembroModule,
    RamaModule,
    ProtagonistaModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
