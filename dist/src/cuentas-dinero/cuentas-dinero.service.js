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
exports.CuentasDineroService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const scope_filter_service_1 = require("../auth/services/scope-filter.service");
const prisma_service_1 = require("../prisma/prisma.service");
let CuentasDineroService = class CuentasDineroService {
    prisma;
    scopeFilterService;
    constructor(prisma, scopeFilterService) {
        this.prisma = prisma;
        this.scopeFilterService = scopeFilterService;
    }
    async findAll(user, paginationQuery) {
        const page = paginationQuery.page ?? 1;
        const limit = paginationQuery.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = this.scopeFilterService.mergeWhere({
            borrado: false,
        }, this.scopeFilterService.forCuentasDinero(user));
        const [data, total] = await this.prisma.$transaction([
            this.prisma.cuentaDinero.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    nombre: 'asc',
                },
                select: {
                    id: true,
                    nombre: true,
                    descripcion: true,
                    monto_actual: true,
                    id_area: true,
                    id_rama: true,
                    Area: {
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
                    _count: {
                        select: {
                            Pago: {
                                where: {
                                    borrado: false,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.cuentaDinero.count({ where }),
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
        const [areas, ramas] = await this.prisma.$transaction([
            this.prisma.area.findMany({
                where: this.scopeFilterService.mergeWhere({ borrado: false }, this.scopeFilterService.forAreas(user)),
                orderBy: { nombre: 'asc' },
                select: {
                    id: true,
                    nombre: true,
                },
            }),
            this.prisma.rama.findMany({
                where: this.scopeFilterService.mergeWhere({ borrado: false }, this.scopeFilterService.forRamas(user)),
                orderBy: { nombre: 'asc' },
                select: {
                    id: true,
                    nombre: true,
                    id_area: true,
                },
            }),
        ]);
        return {
            areas,
            ramas,
        };
    }
    async findOne(id, user) {
        const cuenta = await this.prisma.cuentaDinero.findFirst({
            where: this.scopeFilterService.mergeWhere({
                id,
                borrado: false,
            }, this.scopeFilterService.forCuentasDinero(user)),
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                monto_actual: true,
                id_area: true,
                id_rama: true,
                Area: {
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
                _count: {
                    select: {
                        Pago: {
                            where: {
                                borrado: false,
                            },
                        },
                    },
                },
            },
        });
        if (!cuenta) {
            throw new common_1.NotFoundException('La cuenta de dinero indicada no existe.');
        }
        return cuenta;
    }
    async create(dto, user) {
        const assignment = await this.resolveAssignment(dto);
        await this.validateScopedAccess(user, assignment);
        await this.ensureUniqueName(dto.nombre, null);
        return this.prisma.cuentaDinero.create({
            data: {
                nombre: dto.nombre.trim(),
                descripcion: dto.descripcion?.trim() || null,
                monto_actual: new client_1.Prisma.Decimal(dto.montoActual),
                id_area: assignment.idArea ?? null,
                id_rama: assignment.idRama ?? null,
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                monto_actual: true,
                id_area: true,
                id_rama: true,
                Area: {
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
                _count: {
                    select: {
                        Pago: {
                            where: {
                                borrado: false,
                            },
                        },
                    },
                },
            },
        });
    }
    async update(id, dto, user) {
        const existing = await this.findOne(id, user);
        const assignment = await this.resolveAssignment({
            idArea: dto.idArea ?? existing.id_area ?? undefined,
            idRama: dto.idRama ?? existing.id_rama ?? undefined,
        });
        await this.validateScopedAccess(user, assignment);
        await this.ensureUniqueName(dto.nombre ?? existing.nombre, id);
        return this.prisma.cuentaDinero.update({
            where: { id },
            data: {
                ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.descripcion !== undefined
                    ? { descripcion: dto.descripcion.trim() || null }
                    : {}),
                ...(dto.montoActual !== undefined
                    ? { monto_actual: new client_1.Prisma.Decimal(dto.montoActual) }
                    : {}),
                id_area: assignment.idArea ?? null,
                id_rama: assignment.idRama ?? null,
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                monto_actual: true,
                id_area: true,
                id_rama: true,
                Area: {
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
                _count: {
                    select: {
                        Pago: {
                            where: {
                                borrado: false,
                            },
                        },
                    },
                },
            },
        });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        await this.prisma.cuentaDinero.update({
            where: { id },
            data: {
                borrado: true,
            },
        });
    }
    async ensureUniqueName(name, currentId) {
        const existing = await this.prisma.cuentaDinero.findFirst({
            where: {
                nombre: name.trim(),
                borrado: false,
                ...(currentId ? { NOT: { id: currentId } } : {}),
            },
            select: {
                id: true,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe una cuenta de dinero activa con ese nombre.');
        }
    }
    async resolveAssignment(input) {
        if (input.idArea && input.idRama) {
            throw new common_1.BadRequestException('La cuenta de dinero debe pertenecer a un area o a una rama, no a ambas.');
        }
        if (!input.idArea && !input.idRama) {
            throw new common_1.BadRequestException('Debes indicar un area o una rama para la cuenta de dinero.');
        }
        if (input.idArea) {
            const area = await this.prisma.area.findFirst({
                where: {
                    id: input.idArea,
                    borrado: false,
                },
                select: { id: true },
            });
            if (!area) {
                throw new common_1.NotFoundException('El area indicada no existe.');
            }
            return { idArea: area.id };
        }
        const rama = await this.prisma.rama.findFirst({
            where: {
                id: input.idRama,
                borrado: false,
            },
            select: {
                id: true,
            },
        });
        if (!rama) {
            throw new common_1.NotFoundException('La rama indicada no existe.');
        }
        return { idRama: rama.id };
    }
    async validateScopedAccess(user, assignment) {
        const scopedWhere = this.scopeFilterService.forCuentasDinero(user);
        if (Object.keys(scopedWhere).length === 0) {
            return;
        }
        const allowed = await this.prisma.cuentaDinero.findFirst({
            where: this.scopeFilterService.mergeWhere({
                borrado: false,
                ...(assignment.idArea ? { id_area: assignment.idArea } : {}),
                ...(assignment.idRama ? { id_rama: assignment.idRama } : {}),
            }, scopedWhere),
            select: { id: true },
        });
        if (!allowed) {
            if (assignment.idArea) {
                const areaMatch = await this.prisma.area.findFirst({
                    where: this.scopeFilterService.mergeWhere({ id: assignment.idArea, borrado: false }, this.scopeFilterService.forAreas(user)),
                    select: { id: true },
                });
                if (areaMatch) {
                    return;
                }
            }
            if (assignment.idRama) {
                const ramaMatch = await this.prisma.rama.findFirst({
                    where: this.scopeFilterService.mergeWhere({ id: assignment.idRama, borrado: false }, this.scopeFilterService.forRamas(user)),
                    select: { id: true },
                });
                if (ramaMatch) {
                    return;
                }
            }
            throw new common_1.ForbiddenException('El usuario no posee un scope valido para esta cuenta de dinero.');
        }
    }
};
exports.CuentasDineroService = CuentasDineroService;
exports.CuentasDineroService = CuentasDineroService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scope_filter_service_1.ScopeFilterService])
], CuentasDineroService);
//# sourceMappingURL=cuentas-dinero.service.js.map