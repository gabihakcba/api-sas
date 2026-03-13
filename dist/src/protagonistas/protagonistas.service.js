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
exports.ProtagonistasService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const scope_filter_service_1 = require("../auth/services/scope-filter.service");
const prisma_service_1 = require("../prisma/prisma.service");
const cuentas_service_1 = require("../cuentas/cuentas.service");
let ProtagonistasService = class ProtagonistasService {
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
        const scopeWhere = this.scopeFilterService.forProtagonistas(user);
        const where = this.scopeFilterService.mergeWhere({
            borrado: false,
            Miembro: {
                borrado: false,
            },
        }, scopeWhere);
        const [data, total] = await this.prisma.$transaction([
            this.prisma.protagonista.findMany({
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
                            MiembroRama: {
                                where: {
                                    borrado: false,
                                    fecha_egreso: null,
                                },
                                orderBy: {
                                    fecha_ingreso: 'desc',
                                },
                                take: 1,
                                select: {
                                    id: true,
                                    fecha_ingreso: true,
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
                    },
                },
            }),
            this.prisma.protagonista.count({
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
    async findOne(id, user) {
        const protagonista = await this.prisma.protagonista.findFirst({
            where: this.scopeFilterService.mergeWhere({
                id,
                borrado: false,
                Miembro: {
                    borrado: false,
                },
            }, this.scopeFilterService.forProtagonistas(user)),
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
                            },
                        },
                        MiembroRama: {
                            where: {
                                borrado: false,
                                fecha_egreso: null,
                            },
                            orderBy: {
                                fecha_ingreso: 'desc',
                            },
                            take: 1,
                            select: {
                                id: true,
                                id_rama: true,
                                fecha_ingreso: true,
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
                },
            },
        });
        if (!protagonista) {
            throw new common_1.NotFoundException('El protagonista indicado no existe.');
        }
        return protagonista;
    }
    async create(dto) {
        return this.prisma.$transaction(async (tx) => {
            const rama = await tx.rama.findFirst({
                where: {
                    id: dto.idRama,
                    borrado: false,
                },
                select: {
                    id: true,
                    nombre: true,
                },
            });
            if (!rama) {
                throw new common_1.NotFoundException('La rama indicada no existe o fue eliminada.');
            }
            const cuentaMiembro = await this.cuentasService.createCuentaConMiembro(tx, dto);
            const protagonista = await tx.protagonista.create({
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
            const miembroRama = await tx.miembroRama.create({
                data: {
                    id_miembro: cuentaMiembro.miembroId,
                    id_rama: rama.id,
                    fecha_ingreso: dto.fechaIngresoRama ?? new Date(),
                },
                select: {
                    id: true,
                    fecha_ingreso: true,
                },
            });
            await this.ensureCuentaDineroProtagonista(tx, cuentaMiembro.miembroId, dto.nombre, dto.apellidos);
            await this.ensureProtagonistaRoleAssignment(tx, cuentaMiembro.cuentaId, rama.id);
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
                protagonista,
                rama,
                miembroRama,
            };
        });
    }
    async update(id, dto, user) {
        const protagonista = await this.findOne(id, user);
        return this.prisma.$transaction(async (tx) => {
            let rama = null;
            if (dto.idRama !== undefined) {
                rama = await tx.rama.findFirst({
                    where: {
                        id: dto.idRama,
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
            }
            await this.cuentasService.updateCuentaConMiembro(tx, {
                cuentaId: protagonista.Miembro.Cuenta.id,
                miembroId: protagonista.Miembro.id,
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
                await tx.protagonista.update({
                    where: { id },
                    data: {
                        ...(dto.esBecado !== undefined ? { es_becado: dto.esBecado } : {}),
                        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
                    },
                });
            }
            const currentRama = protagonista.Miembro.MiembroRama[0] ?? null;
            if (dto.idRama !== undefined) {
                if (currentRama) {
                    await tx.miembroRama.update({
                        where: { id: currentRama.id },
                        data: {
                            id_rama: dto.idRama,
                            fecha_ingreso: dto.fechaIngresoRama ?? new Date(),
                        },
                    });
                }
                else {
                    await tx.miembroRama.create({
                        data: {
                            id_miembro: protagonista.Miembro.id,
                            id_rama: dto.idRama,
                            fecha_ingreso: dto.fechaIngresoRama ?? new Date(),
                        },
                    });
                }
                await this.ensureProtagonistaRoleAssignment(tx, protagonista.Miembro.Cuenta.id, dto.idRama);
            }
            return this.findOne(id, user);
        });
    }
    async registerPase(id, dto, user) {
        const protagonista = await this.findOne(id, user);
        return this.prisma.$transaction(async (tx) => {
            const rama = await tx.rama.findFirst({
                where: {
                    id: dto.idRama,
                    borrado: false,
                },
                select: {
                    id: true,
                },
            });
            if (!rama) {
                throw new common_1.NotFoundException('La rama indicada no existe o fue eliminada.');
            }
            const currentRama = protagonista.Miembro.MiembroRama[0] ?? null;
            if (currentRama) {
                await tx.miembroRama.update({
                    where: { id: currentRama.id },
                    data: {
                        fecha_egreso: dto.fechaIngresoRama ?? new Date(),
                    },
                });
            }
            await tx.miembroRama.create({
                data: {
                    id_miembro: protagonista.Miembro.id,
                    id_rama: dto.idRama,
                    fecha_ingreso: dto.fechaIngresoRama ?? new Date(),
                },
            });
            await this.ensureProtagonistaRoleAssignment(tx, protagonista.Miembro.Cuenta.id, dto.idRama);
            return this.findOne(id, user);
        });
    }
    async remove(id, user) {
        const protagonista = await this.findOne(id, user);
        return this.prisma.$transaction(async (tx) => {
            const currentRama = protagonista.Miembro.MiembroRama[0] ?? null;
            if (currentRama) {
                await tx.miembroRama.update({
                    where: { id: currentRama.id },
                    data: {
                        fecha_egreso: new Date(),
                    },
                });
            }
            await tx.protagonista.update({
                where: { id },
                data: {
                    borrado: true,
                    activo: false,
                },
            });
            await tx.miembro.update({
                where: { id: protagonista.Miembro.id },
                data: {
                    borrado: true,
                },
            });
            await tx.cuentaDinero.updateMany({
                where: {
                    id_miembro: protagonista.Miembro.id,
                    borrado: false,
                },
                data: {
                    borrado: true,
                },
            });
            await tx.cuenta.update({
                where: { id: protagonista.Miembro.Cuenta.id },
                data: {
                    borrado: true,
                },
            });
            await this.removeProtagonistaRoleAssignment(tx, protagonista.Miembro.Cuenta.id);
        });
    }
    async ensureProtagonistaRoleAssignment(tx, cuentaId, ramaId) {
        const role = await tx.role.findUnique({
            where: {
                nombre: 'PROTAGONISTA',
            },
            select: {
                id: true,
            },
        });
        if (!role) {
            throw new common_1.NotFoundException('El rol PROTAGONISTA no existe. Ejecuta el seed base para crearlo.');
        }
        await tx.cuentaRole.deleteMany({
            where: {
                id_cuenta: cuentaId,
                id_role: role.id,
            },
        });
        await tx.cuentaRole.create({
            data: {
                id_cuenta: cuentaId,
                id_role: role.id,
                tipo_scope: client_1.SCOPE.RAMA,
                id_scope: ramaId,
            },
        });
    }
    async removeProtagonistaRoleAssignment(tx, cuentaId) {
        const role = await tx.role.findUnique({
            where: {
                nombre: 'PROTAGONISTA',
            },
            select: {
                id: true,
            },
        });
        if (!role) {
            return;
        }
        await tx.cuentaRole.deleteMany({
            where: {
                id_cuenta: cuentaId,
                id_role: role.id,
            },
        });
    }
    async ensureCuentaDineroProtagonista(tx, miembroId, nombre, apellidos) {
        const existing = await tx.cuentaDinero.findFirst({
            where: {
                id_miembro: miembroId,
            },
            select: {
                id: true,
            },
        });
        const data = {
            nombre: `Caja ${nombre} ${apellidos}`.trim(),
            descripcion: `Cuenta personal del protagonista ${nombre} ${apellidos}`.trim(),
            id_miembro: miembroId,
            id_area: null,
            id_rama: null,
            borrado: false,
        };
        if (existing) {
            await tx.cuentaDinero.update({
                where: { id: existing.id },
                data,
            });
            return;
        }
        await tx.cuentaDinero.create({
            data,
        });
    }
};
exports.ProtagonistasService = ProtagonistasService;
exports.ProtagonistasService = ProtagonistasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cuentas_service_1.CuentasService,
        scope_filter_service_1.ScopeFilterService])
], ProtagonistasService);
//# sourceMappingURL=protagonistas.service.js.map