import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PUBLICK_KEY } from 'src/common/constants/key-decorators';
import {
  AuthAccountContext,
  DependentAccessContext,
} from '../interfaces/auth-account-context.interface';
import { CuentaService } from 'src/modules/cuenta/cuenta.service';
import { AuthService } from '../auth.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';

const isDependentAccessContext = (
  value: unknown,
): value is DependentAccessContext => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { cuentaId, miembroId, protagonistaId } = value as Record<
    string,
    unknown
  >;

  return (
    typeof cuentaId === 'number' &&
    typeof miembroId === 'number' &&
    (protagonistaId === undefined || typeof protagonistaId === 'number')
  );
};

const isAuthAccountContext = (value: unknown): value is AuthAccountContext => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { cuentaId, miembroId, protagonistaId, responsableId, dependents } =
    value as Record<string, unknown>;

  return (
    typeof cuentaId === 'number' &&
    (miembroId === undefined || typeof miembroId === 'number') &&
    (protagonistaId === undefined || typeof protagonistaId === 'number') &&
    (responsableId === undefined || typeof responsableId === 'number') &&
    Array.isArray(dependents) &&
    dependents.every(isDependentAccessContext)
  );
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly cuentaService: CuentaService,
    private readonly prismaService: PrismaService,
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
    const cuentaId = Number(sub);

    if (!Number.isFinite(cuentaId)) {
      throw new UnauthorizedException(
        'Token inválido: identificador inesperado',
      );
    }

    const cuenta = await this.cuentaService.findById(
      this.prismaService,
      cuentaId,
    );

    // Cuenta no encontrada
    if (!cuenta) {
      throw new UnauthorizedException(`Cuenta no encontrada: [${String(sub)}]`);
    }

    const rawAccountContext = await this.cuentaService.buildAuthAccountContext(
      this.prismaService,
      cuentaId,
    );

    if (
      rawAccountContext !== null &&
      !isAuthAccountContext(rawAccountContext)
    ) {
      throw new UnauthorizedException(
        'Token inválido: contexto de cuenta inesperado',
      );
    }

    const accountContext: AuthAccountContext | null = rawAccountContext;

    request['id'] = manageToken.sub;
    request['roles'] = manageToken.roles;
    request['accountContext'] = accountContext ?? undefined;

    return true;
  }
}
