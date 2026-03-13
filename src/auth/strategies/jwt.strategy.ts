import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { SCOPE } from '@prisma/client';
import { Injectable } from '@nestjs/common';

interface JwtPayload {
  sub: number;
  username: string;
  roles: string[];
  permissions: string[];
  scopes: Array<{
    role: string;
    scopeType: SCOPE;
    scopeId: number | null;
  }>;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
      permissions: payload.permissions,
      scopes: payload.scopes,
    };
  }
}
