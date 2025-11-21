import { JwtPayload } from 'jsonwebtoken';

export interface AuthTokenPayload extends Omit<JwtPayload, 'sub'> {
  sub: number;
  username: string;
  roles: Array<{
    name: string;
    scope: 'GLOBAL' | 'RAMA' | 'OWN';
    scopeId?: number | null;
  }>;
}
