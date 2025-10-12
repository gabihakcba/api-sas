import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CuentaService } from '../cuenta/cuenta.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly cuentaService: CuentaService) {}

  public async validateUser(user: string, password: string) {
    const cuenta = await this.cuentaService.findByUser(user, true);
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

  public async generateJwt(user: string) {
    const cuenta = (await this.cuentaService.findByUser(user, false)) as {
      id: number;
      user: string;
      CuentaRole: Array<{
        Role: {
          nombre: string;
          descripcion: string;
        };
      }>;
    } | null;
    if (cuenta) {
      const payload: { sub: number; roles: string[] } = {
        sub: cuenta.id,
        roles: cuenta.CuentaRole.map((cr) => cr.Role.nombre),
      };
      return {
        access_token: this.signJwt({
          payload: payload as unknown as jwt.JwtPayload,
          secret: process.env.JWT_SECRET as string,
          expiresIn: '1d',
        }),
        cuenta,
      };
    }
    return null;
  }

  public useToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      return decoded as string | { sub: number; roles: string[] };
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
