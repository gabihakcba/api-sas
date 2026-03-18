import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasUnrestrictedAccess } from '../auth/utils/unrestricted-access.util';
import { PrismaService } from '../prisma/prisma.service';
import { ComisionesQueryDto } from './dto/comisiones-query.dto';
import { CreateComisionDto } from './dto/create-comision.dto';
import { UpdateComisionParticipantesDto } from './dto/update-comision-participantes.dto';
import { UpdateComisionDto } from './dto/update-comision.dto';

@Injectable()
export class ComisionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser, query: ComisionesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const trimmedQuery = query.q?.trim();
    const numericQuery =
      trimmedQuery && /^\d+$/.test(trimmedQuery) ? Number(trimmedQuery) : null;
    const where: Prisma.ComisionWhereInput = {
      borrado: false,
      ...this.buildComisionScopeWhere(user),
      ...(trimmedQuery
        ? {
            OR: [
              { nombre: { contains: trimmedQuery, mode: 'insensitive' } },
              { descripcion: { contains: trimmedQuery, mode: 'insensitive' } },
              {
                Evento: {
                  nombre: { contains: trimmedQuery, mode: 'insensitive' },
                },
              },
              ...(numericQuery ? [{ id: numericQuery }] : []),
            ],
          }
        : {}),
      ...(query.idEvento !== undefined ? { id_evento: query.idEvento } : {}),
    };

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
    const [eventos, adultos] = await this.prisma.$transaction([
      this.prisma.evento.findMany({
        where: { borrado: false },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      }),
      this.prisma.adulto.findMany({
        where: {
          borrado: false,
          activo: true,
          Miembro: {
            borrado: false,
          },
        },
        orderBy: [{ Miembro: { apellidos: 'asc' } }, { Miembro: { nombre: 'asc' } }],
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
      }),
    ]);

    return { eventos, adultos };
  }

  async findOne(id: number, user?: AuthenticatedUser) {
    const comision = await this.prisma.comision.findFirst({
      where: {
        id,
        borrado: false,
        ...(user ? this.buildComisionScopeWhere(user) : {}),
      },
      select: this.comisionDetailSelect(),
    });

    if (!comision) {
      throw new NotFoundException('La comisión indicada no existe.');
    }

    return comision;
  }

  async create(dto: CreateComisionDto) {
    if (dto.idEvento !== undefined) {
      await this.ensureEventoExists(dto.idEvento);
    }

    const created = await this.prisma.comision.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        id_evento: dto.idEvento ?? null,
      },
      select: { id: true },
    });
    return this.findOne(created.id);
  }

  async update(id: number, dto: UpdateComisionDto) {
    await this.ensureExists(id);
    if (dto.idEvento !== undefined && dto.idEvento !== null) {
      await this.ensureEventoExists(dto.idEvento);
    }
    return this.prisma.comision.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion.trim() || null }
          : {}),
        ...(dto.idEvento !== undefined ? { id_evento: dto.idEvento } : {}),
      },
      select: this.comisionDetailSelect(),
    });
  }

  async getParticipantes(id: number, user?: AuthenticatedUser) {
    await this.ensureExists(id, user);

    return this.prisma.participantesComision.findMany({
      where: {
        id_comision: id,
        borrado: false,
        fecha_fin: null,
        Miembro: {
          borrado: false,
          Adulto: {
            is: {
              borrado: false,
              activo: true,
            },
          },
        },
      },
      orderBy: [{ Miembro: { apellidos: 'asc' } }, { Miembro: { nombre: 'asc' } }],
      select: {
        id: true,
        fecha_inicio: true,
        Miembro: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            dni: true,
          },
        },
      },
    });
  }

  async updateParticipantes(id: number, dto: UpdateComisionParticipantesDto) {
    await this.ensureExists(id);
    await this.ensureAdultMembersExist(dto.miembroIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.participantesComision.updateMany({
        where: {
          id_comision: id,
          borrado: false,
          fecha_fin: null,
          id_miembro: { notIn: dto.miembroIds },
        },
        data: {
          fecha_fin: new Date(),
        },
      });

      const existing = await tx.participantesComision.findMany({
        where: {
          id_comision: id,
          id_miembro: { in: dto.miembroIds },
        },
        select: {
          id: true,
          id_miembro: true,
          borrado: true,
          fecha_fin: true,
        },
      });

      const existingMap = new Map(existing.map((item) => [item.id_miembro, item]));

      for (const miembroId of dto.miembroIds) {
        const current = existingMap.get(miembroId);

        if (!current) {
          await tx.participantesComision.create({
            data: {
              id_comision: id,
              id_miembro: miembroId,
            },
          });
          continue;
        }

        if (current.borrado || current.fecha_fin !== null) {
          await tx.participantesComision.update({
            where: { id: current.id },
            data: {
              borrado: false,
              fecha_inicio: new Date(),
              fecha_fin: null,
            },
          });
        }
      }
    });

    return this.getParticipantes(id);
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

  private async ensureExists(id: number, user?: AuthenticatedUser) {
    const comision = await this.prisma.comision.findFirst({
      where: {
        id,
        borrado: false,
        ...(user ? this.buildComisionScopeWhere(user) : {}),
      },
      select: { id: true },
    });
    if (!comision) {
      throw new NotFoundException('La comisión indicada no existe.');
    }
  }

  private buildComisionScopeWhere(
    user: AuthenticatedUser,
  ): Prisma.ComisionWhereInput {
    if (hasUnrestrictedAccess(user)) {
      return {};
    }

    if (user.roles.includes('PROTAGONISTA')) {
      return {
        Evento: {
          is: {
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
          },
        },
      };
    }

    if (user.roles.includes('RESPONSABLE')) {
      return {
        Evento: {
          is: {
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
          },
        },
      };
    }

    for (const scope of user.scopes) {
      if (
        (scope.role === 'JEFATURA_RAMA' || scope.role === 'AYUDANTE_RAMA') &&
        scope.scopeType === SCOPE.RAMA &&
        scope.scopeId != null
      ) {
        return {
          Evento: {
            is: {
              RamaAfectada: {
                some: {
                  id_rama: scope.scopeId,
                  borrado: false,
                },
              },
            },
          },
        };
      }
    }

    return {
      id: -1,
    };
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

  private async ensureAdultMembersExist(miembroIds: number[]) {
    if (miembroIds.length === 0) {
      return;
    }

    const count = await this.prisma.miembro.count({
      where: {
        id: { in: miembroIds },
        borrado: false,
        Adulto: {
          is: {
            borrado: false,
            activo: true,
          },
        },
      },
    });

    if (count !== miembroIds.length) {
      throw new NotFoundException(
        'Uno o más participantes no existen o no corresponden a adultos activos.',
      );
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

  private comisionDetailSelect() {
    return {
      ...this.comisionSelect(),
      ParticipantesComision: {
        where: {
          borrado: false,
          fecha_fin: null,
          Miembro: {
            borrado: false,
          },
        },
        orderBy: [{ Miembro: { apellidos: 'asc' } }, { Miembro: { nombre: 'asc' } }],
        select: {
          id: true,
          fecha_inicio: true,
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
    } satisfies Prisma.ComisionSelect;
  }
}
