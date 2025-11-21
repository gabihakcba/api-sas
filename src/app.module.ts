import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { CuentaModule } from './modules/cuenta/cuenta.module';
import { MiembroModule } from './modules/miembro/miembro.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProtagonistaModule } from './modules/protagonista/protagonista.module';
import { RamaModule } from './modules/rama/rama.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [
        '.env',
        '.develop.env',
        '.development.env',
        '.production.env',
        '.test.env',
      ],
      validate: validateEnv,
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
