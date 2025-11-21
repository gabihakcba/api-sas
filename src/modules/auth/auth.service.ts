import { type Cuenta } from '@prisma/client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthTokenPayload } from './interfaces/auth-token-payload.interface';
import { CuentaService } from '../cuenta/cuenta.service';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  username: string;
  roles: Array<{
    name: string;
    scope: 'GLOBAL' | 'RAMA' | 'OWN';
    scopeId?: number | null;
  }>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly cuentaService: CuentaService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  public async validateUser(user: string, password: string) {
    const cuenta = await this.cuentaService.findByUser(
      this.prismaService,
      user,
    );
    if (cuenta) {
      const isMatch = await bcrypt.compare(password, cuenta.password);
      if (isMatch) {
        return cuenta;
      }
    }

    return null;
  }

  public signJwt({
    payload,
    secret,
    expiresIn,
  }: {
    payload: jwt.JwtPayload;
    secret: string;
    expiresIn: jwt.SignOptions['expiresIn'];
  }) {
    try {
      return jwt.sign(payload, secret, {
        expiresIn,
      });
    } catch (error: any) {
      throw new Error(
        `JWT signing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private getAccessSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return secret;
  }

  private getRefreshSecret(): string {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    return refreshSecret ?? this.getAccessSecret();
  }

  private buildTokens(cuenta: any) {
    const payload: JwtPayload = {
      sub: cuenta.id,
      username: cuenta.user,
      roles: cuenta.CuentaRole.map((cr: any) => ({
        name: cr.Role.nombre,
        scope: cr.tipo_scope,
        scopeId: cr.id_scope,
      })),
    };

    return {
      access_token: this.signJwt({
        payload: payload as unknown as jwt.JwtPayload,
        secret: this.getAccessSecret(),
        expiresIn: '30d',
      }),
      refresh_token: this.signJwt({
        payload: payload as unknown as jwt.JwtPayload,
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      }),
    };
  }

  public async generateJwt(user: string) {
    const cuenta = await this.cuentaService.findByUser(
      this.prismaService,
      user,
    );
    if (cuenta) {
      return this.buildTokens(cuenta);
    }
    return null;
  }

  public async refreshTokens(refreshToken: string) {
    const payload = this.useToken(refreshToken, this.getRefreshSecret());
    if (typeof payload === 'string') {
      throw new UnauthorizedException('Token de refresco inválido');
    }

    const { sub } = payload;
    const cuentaId = Number(sub);

    if (!Number.isFinite(cuentaId)) {
      throw new UnauthorizedException(
        'Token de refresco inválido: sub inesperado',
      );
    }

    const cuenta = await this.cuentaService.findById(
      this.prismaService,
      cuentaId,
    );
    return this.buildTokens(cuenta);
  }

  public useToken(
    token: string,
    secret: string = this.getAccessSecret(),
  ): AuthTokenPayload | string {
    try {
      const decoded = jwt.verify(token, secret);

      if (typeof decoded === 'string') {
        return decoded;
      }

      const { sub, roles, username } = decoded as jwt.JwtPayload & {
        sub?: unknown;
        roles?: unknown;
        username?: unknown;
      };

      if (
        typeof sub !== 'number' ||
        !Array.isArray(roles) ||
        typeof username !== 'string'
      ) {
        throw new UnauthorizedException('Token inválido: payload inesperado');
      }

      const validatedRoles = roles.filter((role): role is any => {
        return (
          typeof role === 'object' &&
          role !== null &&
          typeof role.name === 'string' &&
          typeof role.scope === 'string'
        );
      });

      if (validatedRoles.length !== roles.length) {
        throw new UnauthorizedException('Token inválido: payload inesperado');
      }

      return {
        ...decoded,
        sub,
        roles: validatedRoles,
        username,
      } as AuthTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException(
          `Token expirado: ${error.expiredAt.toISOString()}`,
        );
      } else if (error instanceof jwt.NotBeforeError) {
        throw new UnauthorizedException(
          `Token no activo: ${error.date.toISOString()}`,
        );
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException(`Token inválido: ${error.message}`);
      } else {
        throw new UnauthorizedException(`Token inválido inesperado`);
      }
    }
  }
}
