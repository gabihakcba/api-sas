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
exports.PagosService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const scope_filter_service_1 = require("../auth/services/scope-filter.service");
const FULL_ACCESS_ROLES = new Set([
    'ADM',
    'OWN',
    'JEFATURA',
    'SECRETARIA_TESORERIA',
]);
const ADULT_SCOPED_ROLES = new Set([
    'JEFATURA_RAMA',
    'AYUDANTE_RAMA',
    'INTENDENCIA',
]);
let PagosService = class PagosService {
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
        }, this.scopeFilterService.forPagos(user));
        const [data, total] = await this.prisma.$transaction([
            this.prisma.pago.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ fecha_pago: 'desc' }, { id: 'desc' }],
                select: this.pagoSelect(),
            }),
            this.prisma.pago.count({ where }),
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
        const [cuentas, conceptos, metodos, miembros] = await this.prisma.$transaction([
            this.prisma.cuentaDinero.findMany({
                where: this.scopeFilterService.mergeWhere({ borrado: false }, this.scopeFilterService.forCuentasDinero(user)),
                orderBy: { nombre: 'asc' },
                select: {
                    id: true,
                    nombre: true,
                    monto_actual: true,
                    id_miembro: true,
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
                        },
                    },
                    Miembro: {
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                        },
                    },
                },
            }),
            this.prisma.conceptoPago.findMany({
                where: { borrado: false },
                orderBy: { nombre: 'asc' },
                select: {
                    id: true,
                    nombre: true,
                },
            }),
            this.prisma.metodoPago.findMany({
                where: { borrado: false },
                orderBy: { nombre: 'asc' },
                select: {
                    id: true,
                    nombre: true,
                },
            }),
            this.prisma.miembro.findMany({
                where: this.buildVisibleMiembroWhere(user),
                orderBy: [{ apellidos: 'asc' }, { nombre: 'asc' }],
                select: {
                    id: true,
                    nombre: true,
                    apellidos: true,
                    dni: true,
                },
            }),
        ]);
        return {
            cuentas,
            conceptos,
            metodos,
            miembros,
        };
    }
    async findOne(id, user) {
        const pago = await this.findOneWithinClient(this.prisma, id, user);
        if (!pago) {
            throw new common_1.NotFoundException('El pago indicado no existe.');
        }
        return pago;
    }
    async create(dto, user) {
        return this.prisma.$transaction(async (tx) => {
            const data = await this.resolvePagoData(tx, dto, user);
            await this.ensureCanRevertDestination(tx, data.idCuentaDinero, 0);
            await this.applyPagoImpact(tx, {
                monto: data.monto,
                idCuentaDinero: data.idCuentaDinero,
                idCuentaOrigen: data.idCuentaOrigen,
            }, 'apply');
            const created = await tx.pago.create({
                data: {
                    monto: data.monto,
                    detalles: data.detalles,
                    fecha_pago: data.fechaPago,
                    id_cuenta_dinero: data.idCuentaDinero,
                    id_cuenta_origen: data.idCuentaOrigen,
                    id_metodo_pago: data.idMetodoPago,
                    id_concepto_pago: data.idConceptoPago,
                    id_miembro: data.idMiembro,
                    id_evento: data.idEvento,
                },
                select: {
                    id: true,
                },
            });
            return this.findOneWithinClient(tx, created.id, user);
        });
    }
    async update(id, dto, user) {
        const existing = await this.findOne(id, user);
        return this.prisma.$transaction(async (tx) => {
            const resolved = await this.resolvePagoData(tx, {
                monto: dto.monto ?? Number(existing.monto),
                detalles: dto.detalles ?? existing.detalles ?? undefined,
                fechaPago: dto.fechaPago ?? new Date(existing.fecha_pago),
                idCuentaDinero: dto.idCuentaDinero ?? existing.CuentaDinero.id,
                idCuentaOrigen: dto.idCuentaOrigen !== undefined
                    ? dto.idCuentaOrigen
                    : (existing.CuentaOrigen?.id ?? undefined),
                idMetodoPago: dto.idMetodoPago ?? existing.MetodoPago.id,
                idConceptoPago: dto.idConceptoPago ?? existing.ConceptoPago.id,
                idMiembro: dto.idMiembro ?? existing.Miembro.id,
                idEvento: dto.idEvento !== undefined
                    ? dto.idEvento
                    : (existing.Evento?.id ?? undefined),
            }, user);
            await this.applyPagoImpact(tx, {
                monto: new client_1.Prisma.Decimal(existing.monto),
                idCuentaDinero: existing.CuentaDinero.id,
                idCuentaOrigen: existing.CuentaOrigen?.id ?? null,
            }, 'revert');
            await this.applyPagoImpact(tx, {
                monto: resolved.monto,
                idCuentaDinero: resolved.idCuentaDinero,
                idCuentaOrigen: resolved.idCuentaOrigen,
            }, 'apply');
            await tx.pago.update({
                where: { id },
                data: {
                    monto: resolved.monto,
                    detalles: resolved.detalles,
                    fecha_pago: resolved.fechaPago,
                    id_cuenta_dinero: resolved.idCuentaDinero,
                    id_cuenta_origen: resolved.idCuentaOrigen,
                    id_metodo_pago: resolved.idMetodoPago,
                    id_concepto_pago: resolved.idConceptoPago,
                    id_miembro: resolved.idMiembro,
                    id_evento: resolved.idEvento,
                },
            });
            return this.findOneWithinClient(tx, id, user);
        });
    }
    async remove(id, user) {
        const existing = await this.findOne(id, user);
        await this.prisma.$transaction(async (tx) => {
            await this.applyPagoImpact(tx, {
                monto: new client_1.Prisma.Decimal(existing.monto),
                idCuentaDinero: existing.CuentaDinero.id,
                idCuentaOrigen: existing.CuentaOrigen?.id ?? null,
            }, 'revert');
            await tx.pago.update({
                where: { id },
                data: {
                    borrado: true,
                },
            });
        });
    }
    pagoSelect() {
        return {
            id: true,
            monto: true,
            detalles: true,
            fecha_pago: true,
            codigo_validacion: true,
            Miembro: {
                select: {
                    id: true,
                    nombre: true,
                    apellidos: true,
                    dni: true,
                },
            },
            MetodoPago: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
            ConceptoPago: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
            CuentaDinero: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
            CuentaOrigen: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
            Evento: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
        };
    }
    async findOneWithinClient(client, id, user) {
        return client.pago.findFirst({
            where: this.scopeFilterService.mergeWhere({
                id,
                borrado: false,
            }, this.scopeFilterService.forPagos(user)),
            select: this.pagoSelect(),
        });
    }
    async resolvePagoData(tx, dto, user) {
        const monto = new client_1.Prisma.Decimal(dto.monto);
        if (monto.lte(0)) {
            throw new common_1.BadRequestException('El monto debe ser mayor a cero.');
        }
        const cuentaDestino = await this.findAccessibleCuentaOrThrow(tx, dto.idCuentaDinero, user);
        let cuentaOrigen = null;
        if (dto.idCuentaOrigen) {
            if (dto.idCuentaOrigen === dto.idCuentaDinero) {
                throw new common_1.BadRequestException('La cuenta de origen y destino no pueden ser la misma.');
            }
            cuentaOrigen = await this.findAccessibleCuentaOrThrow(tx, dto.idCuentaOrigen, user);
        }
        await this.ensureVisibleMiembro(tx, dto.idMiembro, user);
        const metodo = await tx.metodoPago.findFirst({
            where: {
                id: dto.idMetodoPago,
                borrado: false,
            },
            select: {
                id: true,
            },
        });
        if (!metodo) {
            throw new common_1.NotFoundException('El método de pago indicado no existe.');
        }
        const concepto = await tx.conceptoPago.findFirst({
            where: {
                id: dto.idConceptoPago,
                borrado: false,
            },
            select: {
                id: true,
            },
        });
        if (!concepto) {
            throw new common_1.NotFoundException('El concepto de pago indicado no existe.');
        }
        if (dto.idEvento) {
            const evento = await tx.evento.findFirst({
                where: {
                    id: dto.idEvento,
                    borrado: false,
                },
                select: {
                    id: true,
                },
            });
            if (!evento) {
                throw new common_1.NotFoundException('El evento indicado no existe.');
            }
        }
        return {
            monto,
            detalles: dto.detalles?.trim() || null,
            fechaPago: dto.fechaPago ?? new Date(),
            idCuentaDinero: cuentaDestino.id,
            idCuentaOrigen: cuentaOrigen?.id ?? null,
            idMetodoPago: dto.idMetodoPago,
            idConceptoPago: dto.idConceptoPago,
            idMiembro: dto.idMiembro,
            idEvento: dto.idEvento ?? null,
        };
    }
    async findAccessibleCuentaOrThrow(tx, id, user) {
        const cuenta = await tx.cuentaDinero.findFirst({
            where: this.scopeFilterService.mergeWhere({
                id,
                borrado: false,
            }, this.scopeFilterService.forCuentasDinero(user)),
            select: {
                id: true,
                nombre: true,
                monto_actual: true,
            },
        });
        if (!cuenta) {
            throw new common_1.ForbiddenException('No tienes acceso a la cuenta de dinero indicada.');
        }
        return cuenta;
    }
    async ensureVisibleMiembro(tx, idMiembro, user) {
        const miembro = await tx.miembro.findFirst({
            where: {
                AND: [
                    { id: idMiembro, borrado: false },
                    this.buildVisibleMiembroWhere(user),
                ],
            },
            select: {
                id: true,
            },
        });
        if (!miembro) {
            throw new common_1.ForbiddenException('No tienes acceso al miembro indicado para registrar este pago.');
        }
    }
    async applyPagoImpact(tx, input, mode) {
        if (mode === 'revert') {
            await this.ensureCanRevertDestination(tx, input.idCuentaDinero, input.monto);
        }
        if (mode === 'apply' && input.idCuentaOrigen) {
            await this.ensureCanDebitOrigin(tx, input.idCuentaOrigen, input.monto);
        }
        if (mode === 'revert') {
            await tx.cuentaDinero.update({
                where: { id: input.idCuentaDinero },
                data: {
                    monto_actual: {
                        decrement: input.monto,
                    },
                },
            });
            if (input.idCuentaOrigen) {
                await tx.cuentaDinero.update({
                    where: { id: input.idCuentaOrigen },
                    data: {
                        monto_actual: {
                            increment: input.monto,
                        },
                    },
                });
            }
            return;
        }
        await tx.cuentaDinero.update({
            where: { id: input.idCuentaDinero },
            data: {
                monto_actual: {
                    increment: input.monto,
                },
            },
        });
        if (input.idCuentaOrigen) {
            await tx.cuentaDinero.update({
                where: { id: input.idCuentaOrigen },
                data: {
                    monto_actual: {
                        decrement: input.monto,
                    },
                },
            });
        }
    }
    async ensureCanDebitOrigin(tx, idCuenta, monto) {
        const cuenta = await tx.cuentaDinero.findFirst({
            where: {
                id: idCuenta,
                borrado: false,
            },
            select: {
                id: true,
                monto_actual: true,
            },
        });
        if (!cuenta) {
            throw new common_1.NotFoundException('La cuenta de origen indicada no existe.');
        }
        if (cuenta.monto_actual.lt(monto)) {
            throw new common_1.ConflictException('La cuenta de origen no tiene saldo suficiente para esta operación.');
        }
    }
    async ensureCanRevertDestination(tx, idCuenta, monto) {
        const amount = typeof monto === 'number' ? new client_1.Prisma.Decimal(monto) : monto;
        const cuenta = await tx.cuentaDinero.findFirst({
            where: {
                id: idCuenta,
                borrado: false,
            },
            select: {
                id: true,
                monto_actual: true,
            },
        });
        if (!cuenta) {
            throw new common_1.NotFoundException('La cuenta de destino indicada no existe.');
        }
        if (cuenta.monto_actual.lt(amount)) {
            throw new common_1.ConflictException('La cuenta de destino no tiene saldo suficiente para revertir esta operación.');
        }
    }
    buildVisibleMiembroWhere(user) {
        if (this.hasFullAccess(user)) {
            return {
                borrado: false,
            };
        }
        const filters = [];
        for (const scope of user.scopes) {
            if (scope.scopeId == null || !ADULT_SCOPED_ROLES.has(scope.role)) {
                continue;
            }
            if (scope.scopeType === client_1.SCOPE.RAMA) {
                filters.push({
                    OR: [
                        {
                            MiembroRama: {
                                some: {
                                    id_rama: scope.scopeId,
                                    borrado: false,
                                    fecha_egreso: null,
                                },
                            },
                        },
                        {
                            Adulto: {
                                is: {
                                    borrado: false,
                                    activo: true,
                                    EquipoArea: {
                                        some: {
                                            id_rama: scope.scopeId,
                                            borrado: false,
                                            activo: true,
                                            fecha_fin: null,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            Responsable: {
                                is: {
                                    borrado: false,
                                    Responsabilidad: {
                                        some: {
                                            borrado: false,
                                            Protagonista: {
                                                borrado: false,
                                                Miembro: {
                                                    MiembroRama: {
                                                        some: {
                                                            id_rama: scope.scopeId,
                                                            borrado: false,
                                                            fecha_egreso: null,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                });
            }
            if (scope.scopeType === client_1.SCOPE.AREA) {
                filters.push({
                    OR: [
                        {
                            MiembroRama: {
                                some: {
                                    borrado: false,
                                    fecha_egreso: null,
                                    Rama: {
                                        id_area: scope.scopeId,
                                        borrado: false,
                                    },
                                },
                            },
                        },
                        {
                            Adulto: {
                                is: {
                                    borrado: false,
                                    activo: true,
                                    EquipoArea: {
                                        some: {
                                            borrado: false,
                                            activo: true,
                                            fecha_fin: null,
                                            OR: [
                                                { id_area: scope.scopeId },
                                                {
                                                    Rama: {
                                                        id_area: scope.scopeId,
                                                        borrado: false,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        {
                            Responsable: {
                                is: {
                                    borrado: false,
                                    Responsabilidad: {
                                        some: {
                                            borrado: false,
                                            Protagonista: {
                                                borrado: false,
                                                Miembro: {
                                                    MiembroRama: {
                                                        some: {
                                                            borrado: false,
                                                            fecha_egreso: null,
                                                            Rama: {
                                                                id_area: scope.scopeId,
                                                                borrado: false,
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                });
            }
        }
        if (user.roles.includes('PROTAGONISTA')) {
            filters.push({
                id_cuenta: user.userId,
                Protagonista: {
                    is: {
                        borrado: false,
                        activo: true,
                    },
                },
            });
        }
        if (user.roles.includes('RESPONSABLE')) {
            filters.push({
                OR: [
                    {
                        id_cuenta: user.userId,
                        Responsable: {
                            is: {
                                borrado: false,
                            },
                        },
                    },
                    {
                        Responsable: {
                            is: {
                                borrado: false,
                                Responsabilidad: {
                                    some: {
                                        borrado: false,
                                    },
                                },
                            },
                        },
                    },
                    {
                        Protagonista: {
                            is: {
                                borrado: false,
                                Responsabilidad: {
                                    some: {
                                        borrado: false,
                                        Responsable: {
                                            Miembro: {
                                                id_cuenta: user.userId,
                                                borrado: false,
                                            },
                                            borrado: false,
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            });
        }
        if (filters.length === 0) {
            return {
                id: -1,
                borrado: false,
            };
        }
        if (filters.length === 1) {
            return {
                AND: [{ borrado: false }, filters[0]],
            };
        }
        return {
            AND: [
                { borrado: false },
                {
                    OR: filters,
                },
            ],
        };
    }
    hasFullAccess(user) {
        if (user.roles.some((role) => FULL_ACCESS_ROLES.has(role))) {
            return true;
        }
        return user.scopes.some((scope) => scope.scopeType === client_1.SCOPE.GLOBAL ||
            scope.scopeType === client_1.SCOPE.GRUPO ||
            scope.scopeType === client_1.SCOPE.OWN);
    }
};
exports.PagosService = PagosService;
exports.PagosService = PagosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scope_filter_service_1.ScopeFilterService])
], PagosService);
//# sourceMappingURL=pagos.service.js.map