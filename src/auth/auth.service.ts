import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthTokenPayload } from './interfaces/auth-token-payload.interface';
import { CuentaService } from '../cuenta/cuenta.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly cuentaService: CuentaService,
    private readonly prismaService: PrismaService,
  ) {}

  public async validateUser(user: string, password: string) {
    const cuenta = await this.cuentaService.findByUser(
      this.prismaService,
      user,
      true,
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

  private getRefreshSecret() {
    return (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) as string;
  }

  private buildTokens({
    id,
    CuentaRole,
    ...rest
  }: {
    id: number;
    user: string;
    CuentaRole: Array<{
      Role: {
        nombre: string;
        descripcion: string | null;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }) {
    const payload: { sub: number; roles: string[] } = {
      sub: id,
      roles: CuentaRole.map((cr) => cr.Role.nombre),
    };

    return {
      access_token: this.signJwt({
        payload: payload as unknown as jwt.JwtPayload,
        secret: process.env.JWT_SECRET as string,
        expiresIn: '30d',
      }),
      refresh_token: this.signJwt({
        payload: payload as unknown as jwt.JwtPayload,
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      }),
      cuenta: { id, CuentaRole, ...rest },
    };
  }

  public async generateJwt(user: string) {
    const cuenta = (await this.cuentaService.findByUser(
      this.prismaService,
      user,
      false,
    )) as {
      id: number;
      user: string;
      CuentaRole: Array<{
        Role: {
          nombre: string;
          descripcion: string | null;
        };
      }>;
    } | null;
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
    secret: string = process.env.JWT_SECRET as string,
  ): AuthTokenPayload | string {
    try {
      const decoded = jwt.verify(token, secret);

      if (typeof decoded === 'string') {
        return decoded;
      }

      const { sub, roles } = decoded as jwt.JwtPayload & {
        sub?: unknown;
        roles?: unknown;
      };

      if (typeof sub !== 'number' || !Array.isArray(roles)) {
        throw new UnauthorizedException('Token inválido: payload inesperado');
      }

      const validatedRoles = roles.filter((role): role is string => {
        return typeof role === 'string';
      });

      if (validatedRoles.length !== roles.length) {
        throw new UnauthorizedException('Token inválido: payload inesperado');
      }

      return { ...decoded, sub, roles: validatedRoles } as AuthTokenPayload;
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
