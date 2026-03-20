import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { ActividadesQueryDto } from './dto/actividades-query.dto';

@Injectable()
export class ActividadesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ActividadesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ActividadWhereInput = {
      borrado: false,
      ...(query.q
        ? {
            nombre: {
              contains: query.q.trim(),
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.actividad.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          objetivos: true,
          materiales: true,
          Tipo: {
            select: {
              id: true,
              nombre: true,
              color: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.actividad.count({ where }),
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
    const actividad = await this.prisma.actividad.findFirst({
      where: { id, borrado: false },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        objetivos: true,
        materiales: true,
        Tipo: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
      },
    });

    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada.');
    }

    return actividad;
  }

  async create(dto: CreateActividadDto) {
    return this.prisma.$transaction(async (tx) => {
      const actividad = await tx.actividad.create({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          objetivos: dto.objetivos,
          materiales: dto.materiales,
          id_tipo: dto.id_tipo,
        },
      });

      if (dto.id_sabatino) {
        // Calculate auto-number if not provided
        let finalNumero = dto.numero;
        if (!finalNumero) {
          const lastActividad = await tx.actividadSabatino.findFirst({
            where: { id_sabatino: dto.id_sabatino },
            orderBy: { numero: 'desc' },
            select: { numero: true },
          });
          finalNumero = (lastActividad?.numero ?? 0) + 1;
        }

        await tx.actividadSabatino.create({
          data: {
            id_actividad: actividad.id,
            id_sabatino: dto.id_sabatino,
            fecha: dto.fecha ? new Date(dto.fecha) : undefined,
            numero: finalNumero,
            Responsables: {
              create: dto.responsableIds?.map((rid: number) => ({
                id_adulto: rid,
              })),
            },
          },
        });
      }

      return actividad;
    });
  }

  async update(id: number, dto: UpdateActividadDto) {
    await this.findOne(id);

    return this.prisma.actividad.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        objetivos: dto.objetivos,
        materiales: dto.materiales,
        id_tipo: dto.id_tipo,
      },
    });
  }

  async remove(id: number) {
    const actividad = await this.findOne(id);

    await this.prisma.actividad.update({
      where: { id: actividad.id },
      data: { borrado: true },
    });

    return { success: true };
  }

  async getTipos() {
    return this.prisma.tipoActividad.findMany({
      orderBy: { nombre: 'asc' },
    });
  }
}
