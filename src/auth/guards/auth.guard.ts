import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CuentaService } from 'src/cuenta/cuenta.service';
import { AuthService } from '../auth.service';
import { PUBLICK_KEY } from 'src/constans/key-decorators';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly cuentaService: CuentaService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * Chequeo si la ruta es pública
     */
    const isPublic = this.reflector.get<boolean>(
      PUBLICK_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    /**
     * Chequeo de token
     */
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    // Si no hay un header o es un array (tipo invalido)
    if (!authHeader || Array.isArray(authHeader)) {
      throw new UnauthorizedException(
        'Token inválido: [Sin definir o tipo inesperado]',
      );
    }

    // Si no es Bearer o no hay token
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Token inválido: [Formato esperado: Bearer <token>]',
      );
    }

    // Token no válido, expirado, con algoritmo diferente, etc
    const manageToken = this.authService.useToken(token);
    if (typeof manageToken === 'string') {
      throw new UnauthorizedException(`Token inválido: [${manageToken}]`);
    }

    /**
     * Chequeo de cuenta valida
     */
    const { sub } = manageToken;
    const cuenta = await this.cuentaService.findById(sub);

    // Cuenta no encontrada
    if (!cuenta) {
      throw new UnauthorizedException(`Cuenta no encontrada: [${sub}]`);
    }

    request['id'] = manageToken.sub;
    request['roles'] = manageToken.roles;

    return true;
  }
}
