import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AssignEventoComisionDto } from './dto/assign-evento-comision.dto';
import { CalendarEventosQueryDto } from './dto/calendar-eventos-query.dto';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoAfectacionesDto } from './dto/update-evento-afectaciones.dto';
import { UpdateEventoInscripcionesDto } from './dto/update-evento-inscripciones.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = { borrado: false };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.evento.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fecha_inicio: 'desc',
        },
        select: this.eventoSelect(),
      }),
      this.prisma.evento.count({ where }),
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
    const [tipos, areas, ramas, miembros, comisiones] = await this.prisma.$transaction([
      this.prisma.tipoEvento.findMany({
        where: { borrado: false },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      }),
      this.prisma.area.findMany({
        where: { borrado: false },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      }),
      this.prisma.rama.findMany({
        where: { borrado: false },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true, id_area: true },
      }),
      this.prisma.miembro.findMany({
        where: { borrado: false },
        orderBy: [{ apellidos: 'asc' }, { nombre: 'asc' }],
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
        },
      }),
      this.prisma.comision.findMany({
        where: { borrado: false },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true, id_evento: true },
      }),
    ]);

    return { tipos, areas, ramas, miembros, comisiones };
  }

  async getCalendarEvents(query: CalendarEventosQueryDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException(
        'Debes indicar un rango de fechas válido para el calendario.',
      );
    }

    if (to < from) {
      throw new BadRequestException(
        'La fecha final del calendario no puede ser anterior a la inicial.',
      );
    }

    return this.prisma.evento.findMany({
      where: {
        borrado: false,
        fecha_inicio: {
          lte: to,
        },
        fecha_fin: {
          gte: from,
        },
        ...(query.idTipo !== undefined ? { id_tipo: query.idTipo } : {}),
        ...(query.idArea !== undefined
          ? {
              AreaAfectada: {
                some: {
                  id_area: query.idArea,
                },
              },
            }
          : {}),
        ...(query.idRama !== undefined
          ? {
              RamaAfectada: {
                some: {
                  id_rama: query.idRama,
                  borrado: false,
                },
              },
            }
          : {}),
      },
      orderBy: [{ fecha_inicio: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        fecha_inicio: true,
        fecha_fin: true,
        lugar: true,
        terminado: true,
        TipoEvento: {
          select: {
            id: true,
            nombre: true,
          },
        },
        AreaAfectada: {
          select: {
            Area: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        RamaAfectada: {
          where: {
            borrado: false,
          },
          select: {
            Rama: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const evento = await this.prisma.evento.findFirst({
      where: { id, borrado: false },
      select: this.eventoDetailSelect(),
    });

    if (!evento) {
      throw new NotFoundException('El evento indicado no existe.');
    }

    return evento;
  }

  async create(dto: CreateEventoDto) {
    this.validateDates(dto.fechaInicio, dto.fechaFin);
    await this.ensureTipoExists(dto.idTipo);
    await this.ensureAreasExist(dto.areaIds ?? []);
    await this.ensureRamasExist(dto.ramaIds ?? []);

    const created = await this.prisma.evento.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        fecha_inicio: dto.fechaInicio,
        fecha_fin: dto.fechaFin,
        lugar: dto.lugar?.trim() || null,
        terminado: dto.terminado ?? false,
        costo_mp: new Prisma.Decimal(dto.costoMp),
        costo_ma: new Prisma.Decimal(dto.costoMa),
        costo_ayudante: new Prisma.Decimal(dto.costoAyudante),
        id_tipo: dto.idTipo,
        AreaAfectada: {
          create: (dto.areaIds ?? []).map((idArea) => ({ id_area: idArea })),
        },
        RamaAfectada: {
          create: (dto.ramaIds ?? []).map((idRama) => ({ id_rama: idRama })),
        },
      },
      select: { id: true },
    });

    return this.findOne(created.id);
  }

  async update(id: number, dto: UpdateEventoDto) {
    await this.ensureEventoExists(id);
    if (dto.fechaInicio && dto.fechaFin) {
      this.validateDates(dto.fechaInicio, dto.fechaFin);
    }
    if (dto.idTipo) {
      await this.ensureTipoExists(dto.idTipo);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.evento.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
          ...(dto.descripcion !== undefined
            ? { descripcion: dto.descripcion.trim() || null }
            : {}),
          ...(dto.fechaInicio !== undefined ? { fecha_inicio: dto.fechaInicio } : {}),
          ...(dto.fechaFin !== undefined ? { fecha_fin: dto.fechaFin } : {}),
          ...(dto.lugar !== undefined ? { lugar: dto.lugar.trim() || null } : {}),
          ...(dto.terminado !== undefined ? { terminado: dto.terminado } : {}),
          ...(dto.costoMp !== undefined
            ? { costo_mp: new Prisma.Decimal(dto.costoMp) }
            : {}),
          ...(dto.costoMa !== undefined
            ? { costo_ma: new Prisma.Decimal(dto.costoMa) }
            : {}),
          ...(dto.costoAyudante !== undefined
            ? { costo_ayudante: new Prisma.Decimal(dto.costoAyudante) }
            : {}),
          ...(dto.idTipo !== undefined ? { id_tipo: dto.idTipo } : {}),
        },
      });

      if (dto.areaIds !== undefined || dto.ramaIds !== undefined) {
        await this.syncAfectacionesWithinClient(tx, id, dto);
      }

      return this.findOneWithinClient(tx, id);
    });
  }

  async remove(id: number) {
    await this.ensureEventoExists(id);
    await this.prisma.evento.update({
      where: { id },
      data: { borrado: true },
    });
  }

  async getInscripciones(id: number) {
    await this.ensureEventoExists(id);
    return this.prisma.inscripcionEvento.findMany({
      where: {
        id_evento: id,
        borrado: false,
        Miembro: { borrado: false },
      },
      orderBy: [{ Miembro: { apellidos: 'asc' } }, { Miembro: { nombre: 'asc' } }],
      select: {
        id: true,
        descripcion: true,
        asistio: true,
        pagado: true,
        monto_total: true,
        saldo_pendiente: true,
        Miembro: {
          select: { id: true, nombre: true, apellidos: true, dni: true },
        },
      },
    });
  }

  async updateInscripciones(id: number, dto: UpdateEventoInscripcionesDto) {
    await this.ensureEventoExists(id);
    await this.ensureMiembrosExist(dto.miembroIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.inscripcionEvento.updateMany({
        where: {
          id_evento: id,
          borrado: false,
          id_miembro: { notIn: dto.miembroIds },
        },
        data: { borrado: true },
      });

      const existing = await tx.inscripcionEvento.findMany({
        where: {
          id_evento: id,
          id_miembro: { in: dto.miembroIds },
        },
        select: {
          id: true,
          id_miembro: true,
          borrado: true,
        },
      });

      const existingMap = new Map(existing.map((item) => [item.id_miembro, item]));

      for (const miembroId of dto.miembroIds) {
        const current = existingMap.get(miembroId);

        if (!current) {
          await tx.inscripcionEvento.create({
            data: {
              id_evento: id,
              id_miembro: miembroId,
            },
          });
          continue;
        }

        if (current.borrado) {
          await tx.inscripcionEvento.update({
            where: { id: current.id },
            data: { borrado: false },
          });
        }
      }
    });

    return this.getInscripciones(id);
  }

  async updateAfectaciones(id: number, dto: UpdateEventoAfectacionesDto) {
    await this.ensureEventoExists(id);
    return this.prisma.$transaction(async (tx) => {
      await this.syncAfectacionesWithinClient(tx, id, dto);
      return this.findOneWithinClient(tx, id);
    });
  }

  async assignComision(id: number, dto: AssignEventoComisionDto) {
    await this.ensureEventoExists(id);

    if (dto.idComision === null) {
      await this.prisma.comision.updateMany({
        where: { id_evento: id, borrado: false },
        data: { id_evento: null },
      });
      return this.findOne(id);
    }

    if (dto.idComision === undefined) {
      throw new BadRequestException('Debes indicar una comisión válida.');
    }

    const comision = await this.prisma.comision.findFirst({
      where: { id: dto.idComision, borrado: false },
      select: { id: true },
    });

    if (!comision) {
      throw new NotFoundException('La comisión indicada no existe.');
    }

    await this.prisma.comision.update({
      where: { id: comision.id },
      data: { id_evento: id },
    });

    return this.findOne(id);
  }

  private async syncAfectacionesWithinClient(
    client: PrismaService | Prisma.TransactionClient,
    idEvento: number,
    dto: { areaIds?: number[]; ramaIds?: number[] },
  ) {
    if (dto.areaIds !== undefined) {
      await this.ensureAreasExist(dto.areaIds);
      await client.areaAfectada.deleteMany({ where: { id_evento: idEvento } });
      if (dto.areaIds.length > 0) {
        await client.areaAfectada.createMany({
          data: dto.areaIds.map((idArea) => ({
            id_evento: idEvento,
            id_area: idArea,
          })),
        });
      }
    }

    if (dto.ramaIds !== undefined) {
      await this.ensureRamasExist(dto.ramaIds);

      await client.ramaAfectada.updateMany({
        where: {
          id_evento: idEvento,
          borrado: false,
          id_rama: { notIn: dto.ramaIds },
        },
        data: { borrado: true },
      });

      const existing = await client.ramaAfectada.findMany({
        where: {
          id_evento: idEvento,
          id_rama: { in: dto.ramaIds },
        },
        select: { id: true, id_rama: true, borrado: true },
      });

      const existingMap = new Map(existing.map((item) => [item.id_rama, item]));

      for (const ramaId of dto.ramaIds) {
        const current = existingMap.get(ramaId);

        if (!current) {
          await client.ramaAfectada.create({
            data: { id_evento: idEvento, id_rama: ramaId },
          });
          continue;
        }

        if (current.borrado) {
          await client.ramaAfectada.update({
            where: { id: current.id },
            data: { borrado: false },
          });
        }
      }
    }
  }

  private validateDates(fechaInicio: Date, fechaFin: Date) {
    if (fechaFin < fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio.',
      );
    }
  }

  private async ensureEventoExists(id: number) {
    const evento = await this.prisma.evento.findFirst({
      where: { id, borrado: false },
      select: { id: true },
    });

    if (!evento) {
      throw new NotFoundException('El evento indicado no existe.');
    }
  }

  private async ensureTipoExists(id: number) {
    const tipo = await this.prisma.tipoEvento.findFirst({
      where: { id, borrado: false },
      select: { id: true },
    });
    if (!tipo) {
      throw new NotFoundException('El tipo de evento indicado no existe.');
    }
  }

  private async ensureAreasExist(ids: number[]) {
    if (ids.length === 0) {
      return;
    }
    const count = await this.prisma.area.count({
      where: { id: { in: ids }, borrado: false },
    });
    if (count !== ids.length) {
      throw new NotFoundException('Una o más áreas afectadas no existen.');
    }
  }

  private async ensureRamasExist(ids: number[]) {
    if (ids.length === 0) {
      return;
    }
    const count = await this.prisma.rama.count({
      where: { id: { in: ids }, borrado: false },
    });
    if (count !== ids.length) {
      throw new NotFoundException('Una o más ramas afectadas no existen.');
    }
  }

  private async ensureMiembrosExist(ids: number[]) {
    if (ids.length === 0) {
      return;
    }
    const count = await this.prisma.miembro.count({
      where: { id: { in: ids }, borrado: false },
    });
    if (count !== ids.length) {
      throw new NotFoundException('Uno o más miembros indicados no existen.');
    }
  }

  private eventoSelect() {
    return {
      id: true,
      nombre: true,
      descripcion: true,
      fecha_inicio: true,
      fecha_fin: true,
      lugar: true,
      terminado: true,
      costo_mp: true,
      costo_ma: true,
      costo_ayudante: true,
      TipoEvento: { select: { id: true, nombre: true } },
      Comision: {
        where: { borrado: false },
        select: { id: true, nombre: true },
      },
      AreaAfectada: {
        select: { Area: { select: { id: true, nombre: true } } },
      },
      RamaAfectada: {
        where: { borrado: false },
        select: { Rama: { select: { id: true, nombre: true } } },
      },
      _count: {
        select: {
          InscripcionEvento: {
            where: { borrado: false },
          },
        },
      },
    } satisfies Prisma.EventoSelect;
  }

  private eventoDetailSelect() {
    return {
      ...this.eventoSelect(),
      InscripcionEvento: {
        where: { borrado: false },
        select: {
          id: true,
          Miembro: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              dni: true,
            },
          },
        },
      },
    } satisfies Prisma.EventoSelect;
  }

  private async findOneWithinClient(
    client: PrismaService | Prisma.TransactionClient,
    id: number,
  ) {
    const evento = await client.evento.findFirst({
      where: { id, borrado: false },
      select: this.eventoDetailSelect(),
    });

    if (!evento) {
      throw new NotFoundException('El evento indicado no existe.');
    }

    return evento;
  }
}
