import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConceptoPagoDto } from './dto/create-concepto-pago.dto';
import { UpdateConceptoPagoDto } from './dto/update-concepto-pago.dto';

@Injectable()
export class ConceptosPagoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationQuery: PaginationQueryDto) {
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

  async findOne(id: number) {
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
      throw new NotFoundException('El concepto de pago indicado no existe.');
    }

    return conceptoPago;
  }

  async create(dto: CreateConceptoPagoDto) {
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
      throw new ConflictException(
        'Ya existe un concepto de pago activo con ese nombre.',
      );
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

  async update(id: number, dto: UpdateConceptoPagoDto) {
    await this.ensureExists(id);

    const normalizedName = dto.nombre?.trim();
    const normalizedDescription =
      dto.descripcion !== undefined
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
        throw new ConflictException(
          'Ya existe un concepto de pago activo con ese nombre.',
        );
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

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prisma.conceptoPago.update({
      where: { id },
      data: {
        borrado: true,
      },
    });
  }

  private async ensureExists(id: number) {
    const conceptoPago = await this.prisma.conceptoPago.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: { id: true },
    });

    if (!conceptoPago) {
      throw new NotFoundException('El concepto de pago indicado no existe.');
    }
  }
}
