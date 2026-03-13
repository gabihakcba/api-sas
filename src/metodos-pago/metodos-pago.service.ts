import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';

@Injectable()
export class MetodosPagoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      borrado: false,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.metodoPago.findMany({
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
      this.prisma.metodoPago.count({ where }),
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
    const metodoPago = await this.prisma.metodoPago.findFirst({
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

    if (!metodoPago) {
      throw new NotFoundException('El metodo de pago indicado no existe.');
    }

    return metodoPago;
  }

  async create(dto: CreateMetodoPagoDto) {
    const normalizedName = dto.nombre.trim();
    const normalizedDescription = dto.descripcion?.trim() || null;

    const existingActive = await this.prisma.metodoPago.findFirst({
      where: {
        nombre: normalizedName,
        borrado: false,
      },
      select: { id: true },
    });

    if (existingActive) {
      throw new ConflictException(
        'Ya existe un metodo de pago activo con ese nombre.',
      );
    }

    const existingDeleted = await this.prisma.metodoPago.findFirst({
      where: {
        nombre: normalizedName,
        borrado: true,
      },
      select: { id: true },
    });

    if (existingDeleted) {
      return this.prisma.metodoPago.update({
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

    return this.prisma.metodoPago.create({
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

  async update(id: number, dto: UpdateMetodoPagoDto) {
    await this.ensureExists(id);

    const normalizedName = dto.nombre?.trim();
    const normalizedDescription =
      dto.descripcion !== undefined
        ? dto.descripcion.trim() || null
        : undefined;

    if (normalizedName) {
      const existing = await this.prisma.metodoPago.findFirst({
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
          'Ya existe un metodo de pago activo con ese nombre.',
        );
      }
    }

    return this.prisma.metodoPago.update({
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

    await this.prisma.metodoPago.update({
      where: { id },
      data: {
        borrado: true,
      },
    });
  }

  private async ensureExists(id: number) {
    const metodoPago = await this.prisma.metodoPago.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: { id: true },
    });

    if (!metodoPago) {
      throw new NotFoundException('El metodo de pago indicado no existe.');
    }
  }
}
