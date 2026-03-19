import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRelacionDto } from './dto/create-relacion.dto';
import { UpdateRelacionDto } from './dto/update-relacion.dto';

@Injectable()
export class RelacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      descripcion: {
        not: null,
      },
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.relacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          tipo: 'asc',
        },
        select: {
          id: true,
          tipo: true,
          descripcion: true,
          _count: {
            select: {
              Responsabilidad: {
                where: {
                  borrado: false,
                },
              },
            },
          },
        },
      }),
      this.prisma.relacion.count({ where }),
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
    const relacion = await this.prisma.relacion.findFirst({
      where: {
        id,
        descripcion: {
          not: null,
        },
      },
      select: {
        id: true,
        tipo: true,
        descripcion: true,
        _count: {
          select: {
            Responsabilidad: {
              where: {
                borrado: false,
              },
            },
          },
        },
      },
    });

    if (!relacion) {
      throw new NotFoundException('La relación indicada no existe.');
    }

    return relacion;
  }

  async create(dto: CreateRelacionDto) {
    const tipo = dto.tipo.trim();
    const descripcion = dto.descripcion?.trim() || null;

    const existing = await this.prisma.relacion.findFirst({
      where: {
        tipo,
      },
      select: {
        id: true,
        descripcion: true,
      },
    });

    if (existing) {
      if (existing.descripcion === null) {
        throw new ConflictException(
          'La relación indicada está reservada por el sistema.',
        );
      }

      throw new ConflictException('Ya existe una relación con ese nombre.');
    }

    return this.prisma.relacion.create({
      data: {
        tipo,
        descripcion,
      },
      select: {
        id: true,
        tipo: true,
        descripcion: true,
        _count: {
          select: {
            Responsabilidad: {
              where: {
                borrado: false,
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateRelacionDto) {
    await this.ensureExists(id);

    const tipo = dto.tipo?.trim();
    const descripcion =
      dto.descripcion !== undefined
        ? dto.descripcion.trim() || null
        : undefined;

    if (tipo) {
      const existing = await this.prisma.relacion.findFirst({
        where: {
          tipo,
          NOT: {
            id,
          },
        },
        select: {
          id: true,
          descripcion: true,
        },
      });

      if (existing) {
        if (existing.descripcion === null) {
          throw new ConflictException(
            'La relación indicada está reservada por el sistema.',
          );
        }

        throw new ConflictException('Ya existe una relación con ese nombre.');
      }
    }

    return this.prisma.relacion.update({
      where: { id },
      data: {
        ...(tipo !== undefined ? { tipo } : {}),
        ...(descripcion !== undefined ? { descripcion } : {}),
      },
      select: {
        id: true,
        tipo: true,
        descripcion: true,
        _count: {
          select: {
            Responsabilidad: {
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
    const relacion = await this.ensureExists(id);

    if (relacion._count.Responsabilidad > 0) {
      throw new ConflictException(
        'No se puede eliminar una relación que tiene responsabilidades asociadas.',
      );
    }

    await this.prisma.relacion.delete({
      where: { id },
    });
  }

  private async ensureExists(id: number) {
    const relacion = await this.prisma.relacion.findFirst({
      where: {
        id,
        descripcion: {
          not: null,
        },
      },
      select: {
        id: true,
        _count: {
          select: {
            Responsabilidad: {
              where: {
                borrado: false,
              },
            },
          },
        },
      },
    });

    if (!relacion) {
      throw new NotFoundException('La relación indicada no existe.');
    }

    return relacion;
  }
}
