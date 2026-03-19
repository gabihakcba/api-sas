import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ACTION, RESOURCE, SCOPE } from '@prisma/client';

export interface RoleScope {
  role: string;
  scopeType: SCOPE;
  scopeId: number | null;
}

export interface UserPayload {
  id: number;
  user: string;
  memberId: number | null;
  roles: string[];
  permissions: string[];
  scopes: RoleScope[];
}

const ADULT_MEMBER_ROLES = new Set([
  'AYUDANTE',
  'JEFATURA',
  'SECRETARIA_TESORERIA',
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
]);

const ADULT_READ_ONLY_ROLES = new Set(['SECRETARIA_TESORERIA', 'INTENDENCIA']);

const ADMIN_BYPASS_ROLES = new Set(['ADM', 'OWN', 'DEV']);
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<UserPayload> {
    const { user, password } = loginDto;
    const identifier = user.trim();

    const account = await this.prisma.cuenta.findFirst({
      where: {
        borrado: false,
        OR: [
          { user: identifier },
          {
            Miembro: {
              borrado: false,
              dni: identifier,
            },
          },
          {
            Miembro: {
              borrado: false,
              email: {
                equals: identifier,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        user: true,
        password: true,
        Miembro: {
          select: {
            id: true,
            Protagonista: {
              select: {
                id: true,
                borrado: true,
                activo: true,
              },
            },
            Responsable: {
              select: {
                id: true,
                borrado: true,
                Responsabilidad: {
                  where: {
                    borrado: false,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        CuentaRole: {
          include: {
            Role: {
              include: {
                RolePermission: {
                  include: {
                    Permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const roles = account.CuentaRole.map((cr) => cr.Role.nombre);

    const scopes = account.CuentaRole.map((cr) => ({
      role: cr.Role.nombre,
      scopeType: cr.tipo_scope,
      scopeId: cr.id_scope ?? null,
    }));

    const permissionsSet = new Set<string>();
    account.CuentaRole.forEach((cr) => {
      cr.Role.RolePermission.forEach((rp) => {
        permissionsSet.add(`${rp.Permission.action}:${rp.Permission.resource}`);
      });
    });

    this.normalizeAdultReadPermissions(roles, scopes, permissionsSet);
    this.normalizeMemberCajaPermissions(account.Miembro, permissionsSet, roles);

    return {
      id: account.id,
      user: account.user,
      memberId: account.Miembro?.id ?? null,
      roles,
      permissions: Array.from(permissionsSet),
      scopes,
    };
  }

  private normalizeAdultReadPermissions(
    roles: string[],
    scopes: RoleScope[],
    permissionsSet: Set<string>,
  ): void {
    const hasAdminBypassRole = roles.some((role) =>
      ADMIN_BYPASS_ROLES.has(role),
    );
    const hasAdultMemberRole = roles.some((role) =>
      ADULT_MEMBER_ROLES.has(role),
    );
    const hasAdultReadOnlyRole = roles.some((role) =>
      ADULT_READ_ONLY_ROLES.has(role),
    );
    const hasFullGroupReadOnlyRoleScope = scopes.some(
      (scope) =>
        ADULT_READ_ONLY_ROLES.has(scope.role) &&
        (scope.scopeType === SCOPE.GRUPO || scope.scopeType === SCOPE.GLOBAL),
    );

    if (
      hasAdminBypassRole ||
      !hasAdultMemberRole ||
      !hasAdultReadOnlyRole ||
      hasFullGroupReadOnlyRoleScope
    ) {
      return;
    }

    permissionsSet.delete(`${ACTION.CREATE}:${RESOURCE.ADULTO}`);
    permissionsSet.delete(`${ACTION.UPDATE}:${RESOURCE.ADULTO}`);
    permissionsSet.delete(`${ACTION.DELETE}:${RESOURCE.ADULTO}`);
    permissionsSet.delete(`${ACTION.MANAGE}:${RESOURCE.ADULTO}`);
    permissionsSet.add(`${ACTION.READ}:${RESOURCE.ADULTO}`);
  }

  private normalizeMemberCajaPermissions(
    miembro: {
      Protagonista: {
        id: number;
        borrado: boolean;
        activo: boolean;
      } | null;
      Responsable: {
        id: number;
        borrado: boolean;
        Responsabilidad: Array<{
          id: number;
        }>;
      } | null;
    } | null,
    permissionsSet: Set<string>,
    roles: string[],
  ): void {
    if (!miembro) {
      return;
    }

    const hasProtagonistaProfile =
      !!miembro.Protagonista &&
      miembro.Protagonista.borrado === false &&
      miembro.Protagonista.activo;
    const hasResponsableProfile =
      !!miembro.Responsable &&
      miembro.Responsable.borrado === false &&
      miembro.Responsable.Responsabilidad.length > 0;

    if (!hasProtagonistaProfile && !hasResponsableProfile) {
      return;
    }

    if (roles.includes('PROTAGONISTA') || roles.includes('RESPONSABLE')) {
      permissionsSet.add(`${ACTION.READ}:${RESOURCE.CUENTA_DINERO}`);
      permissionsSet.add(`${ACTION.READ}:${RESOURCE.PAGO}`);
      permissionsSet.add(`${ACTION.READ}:${RESOURCE.CONSEJO}`);
      permissionsSet.add(`${ACTION.READ}:${RESOURCE.EVENTO}`);
      permissionsSet.add(`${ACTION.READ}:${RESOURCE.REUNION}`);
    }
  }

  login(user: UserPayload) {
    const payload = {
      username: user.user,
      sub: user.id,
      memberId: user.memberId,
      roles: user.roles,
      permissions: user.permissions,
      scopes: user.scopes,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        user: user.user,
        memberId: user.memberId,
        roles: user.roles,
        permissions: user.permissions,
        scopes: user.scopes,
      },
    };
  }
}
