"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
const client_1 = require("@prisma/client");
const ADULT_MEMBER_ROLES = new Set([
    'JEFATURA',
    'SECRETARIA_TESORERIA',
    'JEFATURA_RAMA',
    'AYUDANTE_RAMA',
    'INTENDENCIA',
]);
const ADMIN_BYPASS_ROLES = new Set(['ADM', 'OWN']);
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(loginDto) {
        const { user: username, password } = loginDto;
        const account = await this.prisma.cuenta.findFirst({
            where: { user: username, borrado: false },
            select: {
                id: true,
                user: true,
                password: true,
                Miembro: {
                    select: {
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
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const isPasswordValid = await bcrypt.compare(password, account.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const rolesSet = new Set(account.CuentaRole.map((cr) => cr.Role.nombre));
        if (account.Miembro?.Protagonista?.borrado === false) {
            rolesSet.add('PROTAGONISTA');
        }
        if (account.Miembro?.Responsable?.borrado === false) {
            rolesSet.add('RESPONSABLE');
        }
        const roles = Array.from(rolesSet);
        const scopes = account.CuentaRole.map((cr) => ({
            role: cr.Role.nombre,
            scopeType: cr.tipo_scope,
            scopeId: cr.id_scope ?? null,
        }));
        const permissionsSet = new Set();
        account.CuentaRole.forEach((cr) => {
            cr.Role.RolePermission.forEach((rp) => {
                permissionsSet.add(`${rp.Permission.action}:${rp.Permission.resource}`);
            });
        });
        this.normalizeAdultReadPermissions(roles, permissionsSet);
        this.normalizeMemberCajaPermissions(account.Miembro, permissionsSet, roles);
        return {
            id: account.id,
            user: account.user,
            roles,
            permissions: Array.from(permissionsSet),
            scopes,
        };
    }
    normalizeAdultReadPermissions(roles, permissionsSet) {
        const hasAdminBypassRole = roles.some((role) => ADMIN_BYPASS_ROLES.has(role));
        const hasAdultMemberRole = roles.some((role) => ADULT_MEMBER_ROLES.has(role));
        if (hasAdminBypassRole || !hasAdultMemberRole) {
            return;
        }
        permissionsSet.delete(`${client_1.ACTION.CREATE}:${client_1.RESOURCE.ADULTO}`);
        permissionsSet.delete(`${client_1.ACTION.UPDATE}:${client_1.RESOURCE.ADULTO}`);
        permissionsSet.delete(`${client_1.ACTION.DELETE}:${client_1.RESOURCE.ADULTO}`);
        permissionsSet.delete(`${client_1.ACTION.MANAGE}:${client_1.RESOURCE.ADULTO}`);
        permissionsSet.add(`${client_1.ACTION.READ}:${client_1.RESOURCE.ADULTO}`);
    }
    normalizeMemberCajaPermissions(miembro, permissionsSet, roles) {
        if (!miembro) {
            return;
        }
        const hasProtagonistaProfile = !!miembro.Protagonista &&
            miembro.Protagonista.borrado === false &&
            miembro.Protagonista.activo;
        const hasResponsableProfile = !!miembro.Responsable &&
            miembro.Responsable.borrado === false &&
            miembro.Responsable.Responsabilidad.length > 0;
        if (!hasProtagonistaProfile && !hasResponsableProfile) {
            return;
        }
        if (roles.includes('PROTAGONISTA') || roles.includes('RESPONSABLE')) {
            permissionsSet.add(`${client_1.ACTION.READ}:${client_1.RESOURCE.CUENTA_DINERO}`);
            permissionsSet.add(`${client_1.ACTION.READ}:${client_1.RESOURCE.PAGO}`);
            permissionsSet.add(`${client_1.ACTION.READ}:${client_1.RESOURCE.CONSEJO}`);
        }
    }
    login(user) {
        const payload = {
            username: user.user,
            sub: user.id,
            roles: user.roles,
            permissions: user.permissions,
            scopes: user.scopes,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                user: user.user,
                roles: user.roles,
                permissions: user.permissions,
                scopes: user.scopes,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map