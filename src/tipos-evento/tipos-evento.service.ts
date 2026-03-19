import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoEventoDto } from './dto/create-tipo-evento.dto';
import { UpdateTipoEventoDto } from './dto/update-tipo-evento.dto';

@Injectable()
export class TiposEventoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = { borrado: false };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tipoEvento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        select: this.tipoEventoSelect(),
      }),
      this.prisma.tipoEvento.count({ where }),
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
    const tipoEvento = await this.prisma.tipoEvento.findFirst({
      where: { id, borrado: false },
      select: this.tipoEventoSelect(),
    });

    if (!tipoEvento) {
      throw new NotFoundException('El tipo de evento indicado no existe.');
    }

    return tipoEvento;
  }

  async create(dto: CreateTipoEventoDto) {
    const nombre = dto.nombre.trim();
    const descripcion = dto.descripcion?.trim() || null;

    const existing = await this.prisma.tipoEvento.findFirst({
      where: {
        nombre,
        borrado: false,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un tipo de evento con ese nombre.',
      );
    }

    const created = await this.prisma.tipoEvento.create({
      data: {
        nombre,
        descripcion,
      },
      select: { id: true },
    });

    return this.findOne(created.id);
  }

  async update(id: number, dto: UpdateTipoEventoDto) {
    await this.ensureExists(id);

    const nombre = dto.nombre?.trim();
    const descripcion =
      dto.descripcion !== undefined
        ? dto.descripcion.trim() || null
        : undefined;

    if (nombre) {
      const existing = await this.prisma.tipoEvento.findFirst({
        where: {
          nombre,
          borrado: false,
          NOT: { id },
        },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException(
          'Ya existe un tipo de evento con ese nombre.',
        );
      }
    }

    return this.prisma.tipoEvento.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(descripcion !== undefined ? { descripcion } : {}),
      },
      select: this.tipoEventoSelect(),
    });
  }

  async remove(id: number) {
    const tipoEvento = await this.prisma.tipoEvento.findFirst({
      where: { id, borrado: false },
      select: {
        id: true,
        _count: {
          select: {
            Evento: {
              where: { borrado: false },
            },
          },
        },
      },
    });

    if (!tipoEvento) {
      throw new NotFoundException('El tipo de evento indicado no existe.');
    }

    if (tipoEvento._count.Evento > 0) {
      throw new ConflictException(
        'No se puede eliminar un tipo de evento que tiene eventos asociados.',
      );
    }

    await this.prisma.tipoEvento.update({
      where: { id },
      data: { borrado: true },
    });
  }

  private async ensureExists(id: number) {
    const tipoEvento = await this.prisma.tipoEvento.findFirst({
      where: { id, borrado: false },
      select: { id: true },
    });

    if (!tipoEvento) {
      throw new NotFoundException('El tipo de evento indicado no existe.');
    }
  }

  private tipoEventoSelect() {
    return {
      id: true,
      nombre: true,
      descripcion: true,
      _count: {
        select: {
          Evento: {
            where: {
              borrado: false,
            },
          },
        },
      },
    };
  }
}
