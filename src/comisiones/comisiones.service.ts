import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComisionDto } from './dto/create-comision.dto';
import { UpdateComisionDto } from './dto/update-comision.dto';

@Injectable()
export class ComisionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = { borrado: false };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.comision.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        select: this.comisionSelect(),
      }),
      this.prisma.comision.count({ where }),
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

  async getOptions() {
    const eventos = await this.prisma.evento.findMany({
      where: { borrado: false },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
    return { eventos };
  }

  async findOne(id: number) {
    const comision = await this.prisma.comision.findFirst({
      where: { id, borrado: false },
      select: this.comisionSelect(),
    });

    if (!comision) {
      throw new NotFoundException('La comisión indicada no existe.');
    }

    return comision;
  }

  async create(dto: CreateComisionDto) {
    const created = await this.prisma.comision.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
      },
      select: { id: true },
    });
    return this.findOne(created.id);
  }

  async update(id: number, dto: UpdateComisionDto) {
    await this.ensureExists(id);
    return this.prisma.comision.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion.trim() || null }
          : {}),
      },
      select: this.comisionSelect(),
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.comision.update({
      where: { id },
      data: {
        borrado: true,
        id_evento: null,
      },
    });
  }

  private async ensureExists(id: number) {
    const comision = await this.prisma.comision.findFirst({
      where: { id, borrado: false },
      select: { id: true },
    });
    if (!comision) {
      throw new NotFoundException('La comisión indicada no existe.');
    }
  }

  private comisionSelect() {
    return {
      id: true,
      nombre: true,
      descripcion: true,
      Evento: {
        select: {
          id: true,
          nombre: true,
        },
      },
      _count: {
        select: {
          ParticipantesComision: {
            where: {
              borrado: false,
              fecha_fin: null,
            },
          },
        },
      },
    };
  }
}
