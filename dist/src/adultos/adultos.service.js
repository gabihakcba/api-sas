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
exports.AdultosService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const scope_filter_service_1 = require("../auth/services/scope-filter.service");
const cuentas_service_1 = require("../cuentas/cuentas.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AdultosService = class AdultosService {
    prisma;
    cuentasService;
    scopeFilterService;
    constructor(prisma, cuentasService, scopeFilterService) {
        this.prisma = prisma;
        this.cuentasService = cuentasService;
        this.scopeFilterService = scopeFilterService;
    }
    async findAll(user, paginationQuery) {
        const page = paginationQuery.page ?? 1;
        const limit = paginationQuery.limit ?? 10;
        const skip = (page - 1) * limit;
        const scopeWhere = this.scopeFilterService.forAdultos(user);
        const where = this.scopeFilterService.mergeWhere({
            borrado: false,
            Miembro: {
                borrado: false,
            },
        }, scopeWhere);
        const [data, total] = await this.prisma.$transaction([
            this.prisma.adulto.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    id: 'asc',
                },
                select: {
                    id: true,
                    es_becado: true,
                    activo: true,
                    Miembro: {
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                            dni: true,
                            email: true,
                            telefono: true,
                            Cuenta: {
                                select: {
                                    id: true,
                                    user: true,
                                    CuentaRole: {
                                        select: {
                                            id: true,
                                            tipo_scope: true,
                                            id_scope: true,
                                            Role: {
                                                select: {
                                                    id: true,
                                                    nombre: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    EquipoArea: {
                        where: {
                            borrado: false,
                            activo: true,
                            fecha_fin: null,
                        },
                        orderBy: {
                            fecha_inicio: 'desc',
                        },
                        select: {
                            id: true,
                            fecha_inicio: true,
                            Area: {
                                select: {
                                    id: true,
                                    nombre: true,
                                },
                            },
                            Posicion: {
                                select: {
                                    id: true,
                                    nombre: true,
                                },
                            },
                            Rama: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    id_area: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.adulto.count({
                where,
            }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getOptions(user) {
        const [areas, posiciones, ramas, roles] = await this.prisma.$transaction([
            this.prisma.area.findMany({
                where: this.scopeFilterService.mergeWhere({
                    borrado: false,
                }, this.scopeFilterService.forAreas(user)),
                orderBy: {
                    nombre: 'asc',
                },
                select: {
                    id: true,
                    nombre: true,
                },
            }),
            this.prisma.posicionArea.findMany({
                orderBy: {
                    nombre: 'asc',
                },
                select: {
                    id: true,
                    nombre: true,
                },
            }),
            this.prisma.rama.findMany({
                where: this.scopeFilterService.mergeWhere({
                    borrado: false,
                }, this.scopeFilterService.forRamas(user)),
                orderBy: {
                    nombre: 'asc',
                },
                select: {
                    id: true,
                    nombre: true,
                    id_area: true,
                },
            }),
            this.prisma.role.findMany({
                orderBy: {
                    nombre: 'asc',
                },
                select: {
                    id: true,
                    nombre: true,
                },
            }),
        ]);
        return {
            areas,
            posiciones,
            ramas,
            roles,
            scopes: Object.values(client_1.SCOPE),
        };
    }
    async findOne(id, user) {
        const adulto = await this.prisma.adulto.findFirst({
            where: this.scopeFilterService.mergeWhere({
                id,
                borrado: false,
                Miembro: {
                    borrado: false,
                },
            }, this.scopeFilterService.forAdultos(user)),
            select: {
                id: true,
                es_becado: true,
                activo: true,
                Miembro: {
                    select: {
                        id: true,
                        nombre: true,
                        apellidos: true,
                        dni: true,
                        fecha_nacimiento: true,
                        direccion: true,
                        email: true,
                        telefono: true,
                        telefono_emergencia: true,
                        totem: true,
                        cualidad: true,
                        Cuenta: {
                            select: {
                                id: true,
                                user: true,
                                CuentaRole: {
                                    orderBy: {
                                        id: 'asc',
                                    },
                                    select: {
                                        id: true,
                                        tipo_scope: true,
                                        id_scope: true,
                                        Role: {
                                            select: {
                                                id: true,
                                                nombre: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                EquipoArea: {
                    where: {
                        borrado: false,
                        activo: true,
                        fecha_fin: null,
                    },
                    orderBy: {
                        fecha_inicio: 'desc',
                    },
                    take: 1,
                    select: {
                        id: true,
                        fecha_inicio: true,
                        id_area: true,
                        id_posicion: true,
                        id_rama: true,
                        Area: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                        Posicion: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                        Rama: {
                            select: {
                                id: true,
                                nombre: true,
                                id_area: true,
                            },
                        },
                    },
                },
            },
        });
        if (!adulto) {
            throw new common_1.NotFoundException('El adulto indicado no existe.');
        }
        return adulto;
    }
    async create(dto) {
        return this.prisma.$transaction(async (tx) => {
            const resolvedAssignment = await this.resolveAssignment(tx, {
                idArea: dto.idArea,
                idPosicion: dto.idPosicion,
                idRama: dto.idRama,
            });
            if (!dto.idRole && (dto.tipoScope || dto.idScope)) {
                throw new common_1.BadRequestException('No se puede asignar un scope sin indicar un rol de cuenta.');
            }
            if (dto.idRole && !dto.tipoScope) {
                throw new common_1.BadRequestException('La asignacion de rol requiere indicar el tipo de scope.');
            }
            let role = null;
            if (dto.idRole) {
                role = await tx.role.findUnique({
                    where: { id: dto.idRole },
                    select: {
                        id: true,
                        nombre: true,
                    },
                });
                if (!role) {
                    throw new common_1.NotFoundException('El rol indicado no existe.');
                }
                this.validateScopeConfiguration(dto, role.nombre, resolvedAssignment.area.id, resolvedAssignment.rama?.id ?? null);
                if (dto.tipoScope === client_1.SCOPE.AREA) {
                    const scopedArea = await tx.area.findFirst({
                        where: {
                            id: dto.idScope,
                            borrado: false,
                        },
                        select: { id: true },
                    });
                    if (!scopedArea) {
                        throw new common_1.NotFoundException('El area usada como scope no existe.');
                    }
                }
                if (dto.tipoScope === client_1.SCOPE.RAMA) {
                    const scopedRama = await tx.rama.findFirst({
                        where: {
                            id: dto.idScope,
                            borrado: false,
                        },
                        select: { id: true },
                    });
                    if (!scopedRama) {
                        throw new common_1.NotFoundException('La rama usada como scope no existe.');
                    }
                }
            }
            if (!role) {
                const derivedRole = await this.resolveAutomaticCuentaRole(tx, {
                    areaNombre: resolvedAssignment.area.nombre,
                    posicionNombre: resolvedAssignment.posicion.nombre,
                    ramaId: resolvedAssignment.rama?.id ?? null,
                    areaId: resolvedAssignment.area.id,
                });
                role = derivedRole.role;
                dto.tipoScope = derivedRole.scopeType;
                dto.idScope = derivedRole.scopeId ?? undefined;
            }
            const cuentaMiembro = await this.cuentasService.createCuentaConMiembro(tx, dto);
            const adulto = await tx.adulto.create({
                data: {
                    id_miembro: cuentaMiembro.miembroId,
                    es_becado: dto.esBecado ?? false,
                    activo: dto.activo ?? true,
                },
                select: {
                    id: true,
                    es_becado: true,
                    activo: true,
                },
            });
            const equipoArea = await tx.equipoArea.create({
                data: {
                    id_area: resolvedAssignment.area.id,
                    id_adulto: adulto.id,
                    id_posicion: resolvedAssignment.posicion.id,
                    id_rama: resolvedAssignment.rama?.id,
                    fecha_inicio: dto.fechaInicioEquipo ?? new Date(),
                },
                select: {
                    id: true,
                    fecha_inicio: true,
                    activo: true,
                },
            });
            let cuentaRole = null;
            if (role && dto.tipoScope) {
                cuentaRole = await tx.cuentaRole.create({
                    data: {
                        id_cuenta: cuentaMiembro.cuentaId,
                        id_role: role.id,
                        tipo_scope: dto.tipoScope,
                        id_scope: dto.idScope ?? null,
                    },
                    select: {
                        id: true,
                        tipo_scope: true,
                        id_scope: true,
                    },
                });
            }
            return {
                cuenta: {
                    id: cuentaMiembro.cuentaId,
                    user: cuentaMiembro.user,
                },
                miembro: {
                    id: cuentaMiembro.miembroId,
                    nombre: dto.nombre,
                    apellidos: dto.apellidos,
                    dni: dto.dni,
                },
                adulto,
                area: resolvedAssignment.area,
                posicion: resolvedAssignment.posicion,
                rama: resolvedAssignment.rama,
                equipoArea,
                cuentaRole: role && cuentaRole
                    ? {
                        id: cuentaRole.id,
                        role: role.nombre,
                        scopeType: cuentaRole.tipo_scope,
                        scopeId: cuentaRole.id_scope,
                    }
                    : null,
            };
        });
    }
    async update(id, dto, user) {
        const adulto = await this.findOne(id, user);
        const currentAssignment = adulto.EquipoArea[0] ?? null;
        const currentCuentaRole = adulto.Miembro.Cuenta.CuentaRole[0] ?? null;
        return this.prisma.$transaction(async (tx) => {
            const resolvedAssignment = await this.resolveAssignment(tx, {
                idArea: dto.idArea ?? currentAssignment?.Area.id,
                idPosicion: dto.idPosicion ?? currentAssignment?.Posicion.id,
                idRama: dto.idRama !== undefined
                    ? dto.idRama
                    : (currentAssignment?.Rama?.id ?? undefined),
            });
            const effectiveDto = {
                user: dto.user ?? adulto.Miembro.Cuenta.user,
                password: dto.password ?? 'password-temporal',
                nombre: dto.nombre ?? adulto.Miembro.nombre,
                apellidos: dto.apellidos ?? adulto.Miembro.apellidos,
                dni: dto.dni ?? adulto.Miembro.dni,
                fechaNacimiento: dto.fechaNacimiento ?? adulto.Miembro.fecha_nacimiento,
                direccion: dto.direccion ?? adulto.Miembro.direccion,
                email: dto.email ?? adulto.Miembro.email ?? undefined,
                telefono: dto.telefono ?? adulto.Miembro.telefono ?? undefined,
                telefonoEmergencia: dto.telefonoEmergencia ?? adulto.Miembro.telefono_emergencia,
                totem: dto.totem ?? adulto.Miembro.totem ?? undefined,
                cualidad: dto.cualidad ?? adulto.Miembro.cualidad ?? undefined,
                idArea: resolvedAssignment.area.id,
                idPosicion: resolvedAssignment.posicion.id,
                idRama: resolvedAssignment.rama?.id,
                fechaInicioEquipo: dto.fechaInicioEquipo ??
                    currentAssignment?.fecha_inicio ??
                    new Date(),
                esBecado: dto.esBecado ?? adulto.es_becado,
                activo: dto.activo ?? adulto.activo,
                idRole: dto.idRole,
                tipoScope: dto.tipoScope,
                idScope: dto.idScope,
            };
            if (dto.idRole !== undefined ||
                dto.tipoScope !== undefined ||
                dto.idScope !== undefined) {
                if (!dto.idRole && (dto.tipoScope || dto.idScope)) {
                    throw new common_1.BadRequestException('No se puede asignar un scope sin indicar un rol de cuenta.');
                }
                if (dto.idRole && !dto.tipoScope) {
                    throw new common_1.BadRequestException('La asignacion de rol requiere indicar el tipo de scope.');
                }
            }
            let role = null;
            if (dto.idRole) {
                role = await tx.role.findUnique({
                    where: { id: dto.idRole },
                    select: {
                        id: true,
                        nombre: true,
                    },
                });
                if (!role) {
                    throw new common_1.NotFoundException('El rol indicado no existe.');
                }
                this.validateScopeConfiguration(effectiveDto, role.nombre, resolvedAssignment.area.id, resolvedAssignment.rama?.id ?? null);
            }
            await this.cuentasService.updateCuentaConMiembro(tx, {
                cuentaId: adulto.Miembro.Cuenta.id,
                miembroId: adulto.Miembro.id,
            }, {
                user: dto.user,
                password: dto.password,
                nombre: dto.nombre,
                apellidos: dto.apellidos,
                dni: dto.dni,
                fechaNacimiento: dto.fechaNacimiento,
                direccion: dto.direccion,
                email: dto.email,
                telefono: dto.telefono,
                telefonoEmergencia: dto.telefonoEmergencia,
                totem: dto.totem,
                cualidad: dto.cualidad,
            });
            if (dto.esBecado !== undefined || dto.activo !== undefined) {
                await tx.adulto.update({
                    where: { id },
                    data: {
                        ...(dto.esBecado !== undefined ? { es_becado: dto.esBecado } : {}),
                        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
                    },
                });
            }
            const assignmentChanged = !currentAssignment ||
                resolvedAssignment.area.id !== currentAssignment.Area.id ||
                resolvedAssignment.posicion.id !== currentAssignment.Posicion.id ||
                (resolvedAssignment.rama?.id ?? null) !==
                    (currentAssignment.Rama?.id ?? null);
            const shouldDeriveRoleFromAssignment = assignmentChanged &&
                (!dto.idRole || dto.idRole === currentCuentaRole?.Role.id);
            if (shouldDeriveRoleFromAssignment) {
                const derivedRole = await this.resolveAutomaticCuentaRole(tx, {
                    areaNombre: resolvedAssignment.area.nombre,
                    posicionNombre: resolvedAssignment.posicion.nombre,
                    ramaId: resolvedAssignment.rama?.id ?? null,
                    areaId: resolvedAssignment.area.id,
                });
                role = derivedRole.role;
                dto.idRole = derivedRole.role.id;
                dto.tipoScope = derivedRole.scopeType;
                dto.idScope = derivedRole.scopeId ?? undefined;
            }
            if (currentAssignment && assignmentChanged) {
                await tx.equipoArea.update({
                    where: { id: currentAssignment.id },
                    data: {
                        activo: false,
                        fecha_fin: dto.fechaInicioEquipo ?? new Date(),
                    },
                });
            }
            if (assignmentChanged) {
                await tx.equipoArea.create({
                    data: {
                        id_area: resolvedAssignment.area.id,
                        id_adulto: id,
                        id_posicion: resolvedAssignment.posicion.id,
                        id_rama: resolvedAssignment.rama?.id,
                        fecha_inicio: dto.fechaInicioEquipo ?? new Date(),
                    },
                });
            }
            else if (currentAssignment && dto.fechaInicioEquipo) {
                await tx.equipoArea.update({
                    where: { id: currentAssignment.id },
                    data: {
                        fecha_inicio: dto.fechaInicioEquipo,
                    },
                });
            }
            if (dto.idRole !== undefined ||
                dto.tipoScope !== undefined ||
                dto.idScope !== undefined) {
                await tx.cuentaRole.deleteMany({
                    where: {
                        id_cuenta: adulto.Miembro.Cuenta.id,
                    },
                });
                if (role && dto.tipoScope) {
                    await tx.cuentaRole.create({
                        data: {
                            id_cuenta: adulto.Miembro.Cuenta.id,
                            id_role: role.id,
                            tipo_scope: dto.tipoScope,
                            id_scope: dto.tipoScope === client_1.SCOPE.GLOBAL ||
                                dto.tipoScope === client_1.SCOPE.GRUPO ||
                                dto.tipoScope === client_1.SCOPE.OWN
                                ? null
                                : (dto.idScope ?? null),
                        },
                    });
                }
            }
            return this.findOne(id, user);
        });
    }
    async remove(id, user) {
        const adulto = await this.findOne(id, user);
        const currentAssignment = adulto.EquipoArea[0] ?? null;
        await this.prisma.$transaction(async (tx) => {
            if (currentAssignment) {
                await tx.equipoArea.update({
                    where: { id: currentAssignment.id },
                    data: {
                        activo: false,
                        fecha_fin: new Date(),
                    },
                });
            }
            await tx.cuentaRole.deleteMany({
                where: {
                    id_cuenta: adulto.Miembro.Cuenta.id,
                },
            });
            await tx.adulto.update({
                where: { id },
                data: {
                    borrado: true,
                    activo: false,
                },
            });
            await tx.miembro.update({
                where: { id: adulto.Miembro.id },
                data: {
                    borrado: true,
                },
            });
            await tx.cuenta.update({
                where: { id: adulto.Miembro.Cuenta.id },
                data: {
                    borrado: true,
                },
            });
        });
    }
    async resolveAssignment(tx, assignment) {
        if (!assignment.idArea) {
            throw new common_1.BadRequestException('Debes indicar un area para el adulto.');
        }
        if (!assignment.idPosicion) {
            throw new common_1.BadRequestException('Debes indicar una posicion para el adulto.');
        }
        const area = await tx.area.findFirst({
            where: {
                id: assignment.idArea,
                borrado: false,
            },
            select: {
                id: true,
                nombre: true,
            },
        });
        if (!area) {
            throw new common_1.NotFoundException('El area indicada no existe o fue eliminada.');
        }
        const posicion = await tx.posicionArea.findUnique({
            where: { id: assignment.idPosicion },
            select: {
                id: true,
                nombre: true,
            },
        });
        if (!posicion) {
            throw new common_1.NotFoundException('La posicion indicada no existe.');
        }
        let rama = null;
        if (assignment.idRama) {
            rama = await tx.rama.findFirst({
                where: {
                    id: assignment.idRama,
                    borrado: false,
                },
                select: {
                    id: true,
                    nombre: true,
                    id_area: true,
                },
            });
            if (!rama) {
                throw new common_1.NotFoundException('La rama indicada no existe o fue eliminada.');
            }
            if (rama.id_area !== area.id) {
                throw new common_1.BadRequestException('La rama indicada no pertenece al area especificada.');
            }
        }
        if (area.nombre === 'Rama' && !assignment.idRama) {
            throw new common_1.BadRequestException('Las asignaciones al area Rama deben indicar una rama.');
        }
        return { area, posicion, rama };
    }
    validateScopeConfiguration(dto, roleName, areaId, ramaId) {
        if (!dto.tipoScope) {
            throw new common_1.BadRequestException('La asignacion de rol requiere un tipo de scope.');
        }
        if (dto.tipoScope === client_1.SCOPE.GLOBAL ||
            dto.tipoScope === client_1.SCOPE.GRUPO ||
            dto.tipoScope === client_1.SCOPE.OWN) {
            if (dto.idScope) {
                throw new common_1.BadRequestException('Los scopes GLOBAL, GRUPO y OWN no deben incluir idScope.');
            }
        }
        if (dto.tipoScope === client_1.SCOPE.AREA) {
            if (!dto.idScope) {
                throw new common_1.BadRequestException('El scope AREA requiere un idScope de area.');
            }
            if (dto.idScope !== areaId) {
                throw new common_1.BadRequestException('El scope AREA debe apuntar al area de la asignacion actual.');
            }
        }
        if (dto.tipoScope === client_1.SCOPE.RAMA) {
            if (!dto.idScope || !ramaId) {
                throw new common_1.BadRequestException('El scope RAMA requiere idScope y una rama asociada al adulto.');
            }
            if (dto.idScope !== ramaId) {
                throw new common_1.BadRequestException('El scope RAMA debe apuntar a la rama de la asignacion actual.');
            }
        }
        if ((roleName === 'JEFATURA_RAMA' || roleName === 'AYUDANTE_RAMA') &&
            dto.tipoScope !== client_1.SCOPE.RAMA) {
            throw new common_1.BadRequestException('Los roles de rama deben utilizar scope RAMA.');
        }
    }
    async resolveAutomaticCuentaRole(tx, assignment) {
        let roleName = null;
        let scopeType = client_1.SCOPE.AREA;
        let scopeId = assignment.areaId;
        if (assignment.areaNombre === 'Rama') {
            roleName =
                assignment.posicionNombre === 'Ayudante'
                    ? 'AYUDANTE_RAMA'
                    : 'JEFATURA_RAMA';
            scopeType = client_1.SCOPE.RAMA;
            scopeId = assignment.ramaId;
        }
        else if (assignment.areaNombre === 'Jefatura') {
            roleName = 'JEFATURA';
            scopeType = client_1.SCOPE.GLOBAL;
            scopeId = null;
        }
        else if (assignment.areaNombre === 'Secretaria y Tesoreria') {
            roleName = 'SECRETARIA_TESORERIA';
            scopeType = client_1.SCOPE.AREA;
            scopeId = assignment.areaId;
        }
        else if (assignment.areaNombre === 'Intendencia') {
            roleName = 'INTENDENCIA';
            scopeType = client_1.SCOPE.AREA;
            scopeId = assignment.areaId;
        }
        if (!roleName) {
            throw new common_1.BadRequestException('No se pudo determinar automaticamente el rol para la asignacion indicada.');
        }
        if (scopeType === client_1.SCOPE.RAMA && !scopeId) {
            throw new common_1.BadRequestException('No se puede asignar un rol de rama sin una rama activa.');
        }
        const role = await tx.role.findUnique({
            where: { nombre: roleName },
            select: {
                id: true,
                nombre: true,
            },
        });
        if (!role) {
            throw new common_1.NotFoundException(`El rol ${roleName} no existe. Ejecuta el seed base para crearlo.`);
        }
        return {
            role,
            scopeType,
            scopeId,
        };
    }
};
exports.AdultosService = AdultosService;
exports.AdultosService = AdultosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cuentas_service_1.CuentasService,
        scope_filter_service_1.ScopeFilterService])
], AdultosService);
//# sourceMappingURL=adultos.service.js.map