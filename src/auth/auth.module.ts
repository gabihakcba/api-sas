import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SignOptions } from 'jsonwebtoken';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ScopesGuard } from './guards/scopes.guard';
import { RolesGuard } from './guards/roles.guard';
import { ScopeFilterService } from './services/scope-filter.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ||
          '7d') as SignOptions['expiresIn'],
      },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    PermissionsGuard,
    RolesGuard,
    ScopesGuard,
    ScopeFilterService,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtAuthGuard,
    PermissionsGuard,
    RolesGuard,
    ScopesGuard,
    ScopeFilterService,
  ],
})
export class AuthModule {}
