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
exports.ConceptosPagoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConceptosPagoService = class ConceptosPagoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(paginationQuery) {
        const page = paginationQuery.page ?? 1;
        const limit = paginationQuery.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            borrado: false,
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.conceptoPago.findMany({
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
            this.prisma.conceptoPago.count({ where }),
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
    async findOne(id) {
        const conceptoPago = await this.prisma.conceptoPago.findFirst({
            where: {
                id,
                borrado: false,
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
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
        if (!conceptoPago) {
            throw new common_1.NotFoundException('El concepto de pago indicado no existe.');
        }
        return conceptoPago;
    }
    async create(dto) {
        const normalizedName = dto.nombre.trim();
        const normalizedDescription = dto.descripcion?.trim() || null;
        const existingActive = await this.prisma.conceptoPago.findFirst({
            where: {
                nombre: normalizedName,
                borrado: false,
            },
            select: { id: true },
        });
        if (existingActive) {
            throw new common_1.ConflictException('Ya existe un concepto de pago activo con ese nombre.');
        }
        const existingDeleted = await this.prisma.conceptoPago.findFirst({
            where: {
                nombre: normalizedName,
                borrado: true,
            },
            select: { id: true },
        });
        if (existingDeleted) {
            return this.prisma.conceptoPago.update({
                where: { id: existingDeleted.id },
                data: {
                    nombre: normalizedName,
                    descripcion: normalizedDescription,
                    borrado: false,
                },
                select: {
                    id: true,
                    nombre: true,
                    descripcion: true,
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
        return this.prisma.conceptoPago.create({
            data: {
                nombre: normalizedName,
                descripcion: normalizedDescription,
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
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
    async update(id, dto) {
        await this.ensureExists(id);
        const normalizedName = dto.nombre?.trim();
        const normalizedDescription = dto.descripcion !== undefined
            ? dto.descripcion.trim() || null
            : undefined;
        if (normalizedName) {
            const existing = await this.prisma.conceptoPago.findFirst({
                where: {
                    nombre: normalizedName,
                    borrado: false,
                    NOT: {
                        id,
                    },
                },
                select: { id: true },
            });
            if (existing) {
                throw new common_1.ConflictException('Ya existe un concepto de pago activo con ese nombre.');
            }
        }
        return this.prisma.conceptoPago.update({
            where: { id },
            data: {
                ...(normalizedName !== undefined ? { nombre: normalizedName } : {}),
                ...(normalizedDescription !== undefined
                    ? { descripcion: normalizedDescription }
                    : {}),
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
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
    async remove(id) {
        await this.ensureExists(id);
        await this.prisma.conceptoPago.update({
            where: { id },
            data: {
                borrado: true,
            },
        });
    }
    async ensureExists(id) {
        const conceptoPago = await this.prisma.conceptoPago.findFirst({
            where: {
                id,
                borrado: false,
            },
            select: { id: true },
        });
        if (!conceptoPago) {
            throw new common_1.NotFoundException('El concepto de pago indicado no existe.');
        }
    }
};
exports.ConceptosPagoService = ConceptosPagoService;
exports.ConceptosPagoService = ConceptosPagoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConceptosPagoService);
//# sourceMappingURL=conceptos-pago.service.js.map