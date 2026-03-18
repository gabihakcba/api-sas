import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import {
  hasScopedRoleAccess,
  hasUnrestrictedAccess,
} from '../auth/utils/unrestricted-access.util';
import { PrismaService } from '../prisma/prisma.service';
import { AssignEventoComisionDto } from './dto/assign-evento-comision.dto';
import { CalendarEventosQueryDto } from './dto/calendar-eventos-query.dto';
import { CreateEventoDto } from './dto/create-evento.dto';
import { EventosQueryDto } from './dto/eventos-query.dto';
import { UpdateEventoAfectacionesDto } from './dto/update-evento-afectaciones.dto';
import { UpdateEventoInscripcionesDto } from './dto/update-evento-inscripciones.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser, query: EventosQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const trimmedQuery = query.q?.trim();
    const numericQuery =
      trimmedQuery && /^\d+$/.test(trimmedQuery) ? Number(trimmedQuery) : null;
    const where = this.mergeEventoWhere(
      {
        borrado: false,
        ...(trimmedQuery
          ? {
              OR: [
                { nombre: { contains: trimmedQuery, mode: 'insensitive' } },
                {
                  descripcion: {
                    contains: trimmedQuery,
                    mode: 'insensitive',
                  },
                },
                { lugar: { contains: trimmedQuery, mode: 'insensitive' } },
                ...(numericQuery ? [{ id: numericQuery }] : []),
              ],
            }
          : {}),
        ...(query.idTipo !== undefined ? { id_tipo: query.idTipo } : {}),
        ...this.buildEventoDateWhere(query.fechaDesde, query.fechaHasta),
      },
      this.buildEventoScopeWhere(user),
    );

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

  async getOptions(user: AuthenticatedUser) {
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
        where: this.buildVisibleMiembroWhere(user),
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

  async getCalendarEvents(
    user: AuthenticatedUser,
    query: CalendarEventosQueryDto,
  ) {
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
      where: this.mergeEventoWhere(
        {
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
        user.roles.includes('PROTAGONISTA') || user.roles.includes('RESPONSABLE')
          ? this.buildEventoScopeWhere(user)
          : undefined,
      ),
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

  async findOne(id: number, user: AuthenticatedUser) {
    const evento = await this.prisma.evento.findFirst({
      where: this.mergeEventoWhere(
        { id, borrado: false },
        this.buildEventoScopeWhere(user),
      ),
      select: this.eventoDetailSelect(),
    });

    if (!evento) {
      throw new NotFoundException('El evento indicado no existe.');
    }

    return evento;
  }

  async create(dto: CreateEventoDto, user: AuthenticatedUser) {
    const normalizedAfectaciones = await this.resolveCreateAfectaciones(dto, user);
    this.validateDates(dto.fechaInicio, dto.fechaFin);
    await this.ensureTipoExists(dto.idTipo);
    await this.ensureAreasExist(normalizedAfectaciones.areaIds);
    await this.ensureRamasExist(normalizedAfectaciones.ramaIds);

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
          create: normalizedAfectaciones.areaIds.map((idArea) => ({ id_area: idArea })),
        },
        RamaAfectada: {
          create: normalizedAfectaciones.ramaIds.map((idRama) => ({ id_rama: idRama })),
        },
      },
      select: { id: true },
    });

    return this.findOne(created.id, user);
  }

  async update(id: number, dto: UpdateEventoDto, user: AuthenticatedUser) {
    await this.ensureEventoExists(id, user);
    if (dto.fechaInicio && dto.fechaFin) {
      this.validateDates(dto.fechaInicio, dto.fechaFin);
    }
    if (dto.idTipo) {
      await this.ensureTipoExists(dto.idTipo);
    }

    return this.prisma.$transaction(async (tx) => {
      const normalizedAfectaciones =
        dto.areaIds !== undefined || dto.ramaIds !== undefined
          ? await this.resolveScopedAfectaciones(
              user,
              dto.areaIds ?? [],
              dto.ramaIds ?? [],
            )
          : null;

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

      if (normalizedAfectaciones) {
        await this.syncAfectacionesWithinClient(tx, id, normalizedAfectaciones);
      }

      return this.findOneWithinClient(tx, id, user);
    });
  }

  async remove(id: number, user: AuthenticatedUser) {
    await this.ensureEventoExists(id, user);
    await this.prisma.evento.update({
      where: { id },
      data: { borrado: true },
    });
  }

  async getInscripciones(id: number, user: AuthenticatedUser) {
    await this.ensureEventoExists(id, user);
    return this.prisma.inscripcionEvento.findMany({
      where: {
        id_evento: id,
        borrado: false,
        Miembro: this.buildVisibleMiembroWhere(user),
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

  async updateInscripciones(
    id: number,
    dto: UpdateEventoInscripcionesDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureEventoExists(id, user);
    await this.ensureMiembrosExist(dto.miembroIds, user);

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

    return this.getInscripciones(id, user);
  }

  async updateAfectaciones(
    id: number,
    dto: UpdateEventoAfectacionesDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureEventoExists(id, user);
    const normalizedAfectaciones = await this.resolveScopedAfectaciones(
      user,
      dto.areaIds ?? [],
      dto.ramaIds ?? [],
    );

    return this.prisma.$transaction(async (tx) => {
      await this.syncAfectacionesWithinClient(tx, id, normalizedAfectaciones);
      return this.findOneWithinClient(tx, id, user);
    });
  }

  async assignComision(
    id: number,
    dto: AssignEventoComisionDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureEventoExists(id, user);

    if (dto.idComision === null) {
      await this.prisma.comision.updateMany({
        where: { id_evento: id, borrado: false },
        data: { id_evento: null },
      });
      return this.findOne(id, user);
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

    return this.findOne(id, user);
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

  private async ensureEventoExists(id: number, user: AuthenticatedUser) {
    const evento = await this.prisma.evento.findFirst({
      where: this.mergeEventoWhere(
        { id, borrado: false },
        this.buildEventoScopeWhere(user),
      ),
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

  private async ensureMiembrosExist(ids: number[], user: AuthenticatedUser) {
    if (ids.length === 0) {
      return;
    }
    const count = await this.prisma.miembro.count({
      where: {
        AND: [this.buildVisibleMiembroWhere(user), { id: { in: ids } }],
      },
    });
    if (count !== ids.length) {
      throw new NotFoundException(
        'Uno o más miembros indicados no existen o no están dentro de tu alcance.',
      );
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
    user: AuthenticatedUser,
  ) {
    const evento = await client.evento.findFirst({
      where: this.mergeEventoWhere(
        { id, borrado: false },
        this.buildEventoScopeWhere(user),
      ),
      select: this.eventoDetailSelect(),
    });

    if (!evento) {
      throw new NotFoundException('El evento indicado no existe.');
    }

    return evento;
  }

  private buildEventoScopeWhere(
    user: AuthenticatedUser,
  ): Prisma.EventoWhereInput | undefined {
    if (hasUnrestrictedAccess(user)) {
      return undefined;
    }

    const filters: Prisma.EventoWhereInput[] = [];

    for (const scope of user.scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (
        (scope.role === 'JEFATURA_RAMA' || scope.role === 'AYUDANTE_RAMA') &&
        scope.scopeType === SCOPE.RAMA
      ) {
        filters.push({
          RamaAfectada: {
            some: {
              id_rama: scope.scopeId,
              borrado: false,
            },
          },
        });
      }
    }

    if (user.roles.includes('PROTAGONISTA')) {
      filters.push({
        OR: [
          {
            AreaAfectada: {
              some: {
                Area: {
                  borrado: false,
                  nombre: 'Jefatura',
                },
              },
            },
          },
          {
            InscripcionEvento: {
              some: {
                borrado: false,
                Miembro: {
                  borrado: false,
                  id_cuenta: user.userId,
                  Protagonista: {
                    is: {
                      borrado: false,
                      activo: true,
                    },
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (user.roles.includes('RESPONSABLE')) {
      filters.push({
        OR: [
          {
            AreaAfectada: {
              some: {
                Area: {
                  borrado: false,
                  nombre: 'Jefatura',
                },
              },
            },
          },
          {
            InscripcionEvento: {
              some: {
                borrado: false,
                Miembro: {
                  borrado: false,
                  id_cuenta: user.userId,
                  Responsable: {
                    is: {
                      borrado: false,
                    },
                  },
                },
              },
            },
          },
          {
            InscripcionEvento: {
              some: {
                borrado: false,
                Miembro: {
                  borrado: false,
                  Protagonista: {
                    is: {
                      borrado: false,
                      Responsabilidad: {
                        some: {
                          borrado: false,
                          Responsable: {
                            is: {
                              borrado: false,
                              Miembro: {
                                borrado: false,
                                id_cuenta: user.userId,
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
          },
        ],
      });
    }

    if (filters.length === 0) {
      return {
        id: -1,
      };
    }

    return filters.length === 1 ? filters[0] : { OR: filters };
  }

  private mergeEventoWhere(
    baseWhere: Prisma.EventoWhereInput,
    scopeWhere?: Prisma.EventoWhereInput,
  ): Prisma.EventoWhereInput {
    if (!scopeWhere) {
      return baseWhere;
    }

    return {
      AND: [baseWhere, scopeWhere],
    };
  }

  private buildEventoDateWhere(
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Prisma.EventoWhereInput {
    if (!fechaDesde && !fechaHasta) {
      return {};
    }

    return {
      AND: [
        ...(fechaDesde
          ? [
              {
                fecha_fin: {
                  gte: fechaDesde,
                },
              } satisfies Prisma.EventoWhereInput,
            ]
          : []),
        ...(fechaHasta
          ? [
              {
                fecha_inicio: {
                  lte: fechaHasta,
                },
              } satisfies Prisma.EventoWhereInput,
            ]
          : []),
      ],
    };
  }

  private async resolveCreateAfectaciones(
    dto: CreateEventoDto,
    user: AuthenticatedUser,
  ): Promise<{ areaIds: number[]; ramaIds: number[] }> {
    return this.resolveScopedAfectaciones(user, dto.areaIds ?? [], dto.ramaIds ?? []);
  }

  private async resolveScopedAfectaciones(
    user: AuthenticatedUser,
    areaIds: number[],
    ramaIds: number[],
  ): Promise<{ areaIds: number[]; ramaIds: number[] }> {
    if (hasScopedRoleAccess(user, 'JEFATURA', [SCOPE.GRUPO, SCOPE.GLOBAL])) {
      const areaJefatura = await this.prisma.area.findFirst({
        where: {
          nombre: 'Jefatura',
          borrado: false,
        },
        select: {
          id: true,
        },
      });

      if (!areaJefatura) {
        throw new NotFoundException('No se pudo resolver el area Jefatura.');
      }

      return {
        areaIds: [areaJefatura.id],
        ramaIds: [],
      };
    }

    const ramaScopeIds = user.scopes
      .filter(
        (scope) =>
          (scope.role === 'JEFATURA_RAMA' || scope.role === 'AYUDANTE_RAMA') &&
          scope.scopeType === SCOPE.RAMA &&
          scope.scopeId != null,
      )
      .map((scope) => scope.scopeId as number);

    if (ramaScopeIds.length > 0) {
      const areaRama = await this.prisma.area.findFirst({
        where: {
          nombre: 'Rama',
          borrado: false,
        },
        select: {
          id: true,
        },
      });

      if (!areaRama) {
        throw new NotFoundException('No se pudo resolver el area Rama.');
      }

      return {
        areaIds: [areaRama.id],
        ramaIds: Array.from(new Set(ramaScopeIds)),
      };
    }

    return {
      areaIds,
      ramaIds,
    };
  }

  private buildVisibleMiembroWhere(user: AuthenticatedUser): Prisma.MiembroWhereInput {
    if (hasUnrestrictedAccess(user)) {
      return {
        borrado: false,
      };
    }

    const filters: Prisma.MiembroWhereInput[] = [];

    for (const scope of user.scopes) {
      if (
        scope.scopeId == null ||
        (scope.role !== 'JEFATURA_RAMA' && scope.role !== 'AYUDANTE_RAMA')
      ) {
        continue;
      }

      if (scope.scopeType === SCOPE.RAMA) {
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
}
