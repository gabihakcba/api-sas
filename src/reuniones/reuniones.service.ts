import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MODALIDAD_REUNION, Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasSoftDeleteAuditAccess } from '../auth/utils/unrestricted-access.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReunionDto } from './dto/create-reunion.dto';
import { ReunionesQueryDto } from './dto/reuniones-query.dto';
import { UpdateReunionInvitadosDto } from './dto/update-reunion-invitados.dto';
import { UpdateReunionDto } from './dto/update-reunion.dto';

@Injectable()
export class ReunionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser, query: ReunionesQueryDto) {
    const memberId = this.ensureMemberId(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const trimmedQuery = query.q?.trim();
    const numericQuery =
      trimmedQuery && /^\d+$/.test(trimmedQuery) ? Number(trimmedQuery) : null;
    const includeDeleted =
      query.includeDeleted === true && hasSoftDeleteAuditAccess(user);

    const where: Prisma.ReunionWhereInput = {
      ...(includeDeleted ? {} : { borrado: false }),
      Invitados: {
        some: {
          id_miembro: memberId,
          borrado: false,
        },
      },
      ...(trimmedQuery
        ? {
            OR: [
              { titulo: { contains: trimmedQuery, mode: 'insensitive' } },
              {
                descripcion: {
                  contains: trimmedQuery,
                  mode: 'insensitive',
                },
              },
              {
                lugar_fisico: {
                  contains: trimmedQuery,
                  mode: 'insensitive',
                },
              },
              {
                url_virtual: {
                  contains: trimmedQuery,
                  mode: 'insensitive',
                },
              },
              ...(numericQuery ? [{ id: numericQuery }] : []),
            ],
          }
        : {}),
      ...(query.modalidad ? { modalidad: query.modalidad } : {}),
      ...this.buildDateWhere(query.fechaDesde, query.fechaHasta),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.reunion.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fecha_inicio: 'desc' }, { id: 'desc' }],
        select: this.reunionListSelect(memberId),
      }),
      this.prisma.reunion.count({ where }),
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
    this.ensureMemberId(user);

    const [areas, ramas, miembros] = await this.prisma.$transaction([
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
    ]);

    return { areas, ramas, miembros };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const memberId = this.ensureMemberId(user);

    const reunion = await this.prisma.reunion.findFirst({
      where: {
        id,
        borrado: false,
        Invitados: {
          some: {
            id_miembro: memberId,
            borrado: false,
          },
        },
      },
      select: this.reunionDetailSelect(memberId),
    });

    if (!reunion) {
      throw new NotFoundException('La reunion indicada no existe.');
    }

    return reunion;
  }

  async create(dto: CreateReunionDto, user: AuthenticatedUser) {
    const memberId = this.ensureMemberId(user);
    const areaIds = this.normalizeIds(dto.areaIds ?? []);
    const ramaIds = this.normalizeIds(dto.ramaIds ?? []);

    this.validateDates(dto.fechaInicio, dto.fechaFin);
    this.validateModalidad(dto.modalidad, dto.lugarFisico, dto.urlVirtual);
    await this.ensureAreasExist(areaIds);
    await this.ensureRamasExist(ramaIds);

    const created = await this.prisma.reunion.create({
      data: {
        titulo: dto.titulo.trim(),
        descripcion: dto.descripcion?.trim() || null,
        fecha_inicio: dto.fechaInicio,
        fecha_fin: dto.fechaFin,
        modalidad: dto.modalidad ?? MODALIDAD_REUNION.PRESENCIAL,
        lugar_fisico: dto.lugarFisico?.trim() || null,
        url_virtual: dto.urlVirtual?.trim() || null,
        AreasAfectadas: {
          create: areaIds.map((idArea) => ({
            id_area: idArea,
          })),
        },
        RamasAfectadas: {
          create: ramaIds.map((idRama) => ({
            id_rama: idRama,
          })),
        },
        Invitados: {
          create: [
            {
              id_miembro: memberId,
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });

    return this.findOne(created.id, user);
  }

  async update(id: number, dto: UpdateReunionDto, user: AuthenticatedUser) {
    const memberId = this.ensureMemberId(user);
    const reunion = await this.ensureReunionAccessible(id, memberId);
    const areaIds =
      dto.areaIds !== undefined ? this.normalizeIds(dto.areaIds) : undefined;
    const ramaIds =
      dto.ramaIds !== undefined ? this.normalizeIds(dto.ramaIds) : undefined;

    const fechaInicio = dto.fechaInicio ?? reunion.fecha_inicio;
    const fechaFin = dto.fechaFin ?? reunion.fecha_fin;
    this.validateDates(fechaInicio, fechaFin);
    this.validateModalidad(
      dto.modalidad ?? reunion.modalidad,
      dto.lugarFisico ?? reunion.lugar_fisico,
      dto.urlVirtual ?? reunion.url_virtual,
    );

    if (areaIds !== undefined) {
      await this.ensureAreasExist(areaIds);
    }
    if (ramaIds !== undefined) {
      await this.ensureRamasExist(ramaIds);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reunion.update({
        where: { id },
        data: {
          ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
          ...(dto.descripcion !== undefined
            ? { descripcion: dto.descripcion.trim() || null }
            : {}),
          ...(dto.fechaInicio !== undefined
            ? { fecha_inicio: dto.fechaInicio }
            : {}),
          ...(dto.fechaFin !== undefined ? { fecha_fin: dto.fechaFin } : {}),
          ...(dto.modalidad !== undefined ? { modalidad: dto.modalidad } : {}),
          ...(dto.lugarFisico !== undefined
            ? { lugar_fisico: dto.lugarFisico.trim() || null }
            : {}),
          ...(dto.urlVirtual !== undefined
            ? { url_virtual: dto.urlVirtual.trim() || null }
            : {}),
        },
      });

      if (areaIds !== undefined) {
        await this.syncAreas(tx, id, areaIds);
      }

      if (ramaIds !== undefined) {
        await this.syncRamas(tx, id, ramaIds);
      }
    });

    return this.findOne(id, user);
  }

  async remove(id: number, user: AuthenticatedUser) {
    const memberId = this.ensureMemberId(user);
    await this.ensureReunionAccessible(id, memberId);

    await this.prisma.reunion.update({
      where: { id },
      data: {
        borrado: true,
      },
    });
  }

  async getInvitados(id: number, user: AuthenticatedUser) {
    const memberId = this.ensureMemberId(user);
    await this.ensureReunionAccessible(id, memberId);

    return this.prisma.invitadoReunion.findMany({
      where: {
        id_reunion: id,
        borrado: false,
        Miembro: {
          borrado: false,
        },
      },
      orderBy: [
        { Miembro: { apellidos: 'asc' } },
        { Miembro: { nombre: 'asc' } },
      ],
      select: {
        id: true,
        asistio: true,
        confirmo: true,
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

  async updateInvitados(
    id: number,
    dto: UpdateReunionInvitadosDto,
    user: AuthenticatedUser,
  ) {
    const memberId = this.ensureMemberId(user);
    await this.ensureReunionAccessible(id, memberId);

    const invitadoIds = this.normalizeIds([...dto.miembroIds, memberId]);
    await this.ensureMiembrosExist(invitadoIds);

    await this.prisma.$transaction(async (tx) => {
      await this.syncInvitados(tx, id, invitadoIds);
    });

    return this.getInvitados(id, user);
  }

  private ensureMemberId(user: AuthenticatedUser): number {
    if (!user.memberId) {
      throw new ForbiddenException(
        'El usuario autenticado no posee un miembro asociado.',
      );
    }

    return user.memberId;
  }

  private async ensureReunionAccessible(id: number, memberId: number) {
    const reunion = await this.prisma.reunion.findFirst({
      where: {
        id,
        borrado: false,
        Invitados: {
          some: {
            id_miembro: memberId,
            borrado: false,
          },
        },
      },
      select: {
        id: true,
        fecha_inicio: true,
        fecha_fin: true,
        modalidad: true,
        lugar_fisico: true,
        url_virtual: true,
      },
    });

    if (!reunion) {
      throw new NotFoundException('La reunion indicada no existe.');
    }

    return reunion;
  }

  private buildDateWhere(
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Prisma.ReunionWhereInput {
    if (!fechaDesde && !fechaHasta) {
      return {};
    }

    if (fechaDesde && fechaHasta && fechaHasta < fechaDesde) {
      throw new BadRequestException(
        'La fecha final no puede ser anterior a la fecha inicial.',
      );
    }

    if (fechaDesde && fechaHasta) {
      return {
        fecha_inicio: {
          lte: fechaHasta,
        },
        fecha_fin: {
          gte: fechaDesde,
        },
      };
    }

    if (fechaDesde) {
      return {
        fecha_fin: {
          gte: fechaDesde,
        },
      };
    }

    return {
      fecha_inicio: {
        lte: fechaHasta,
      },
    };
  }

  private validateDates(fechaInicio: Date, fechaFin: Date) {
    if (fechaFin < fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior o igual a la fecha de inicio.',
      );
    }
  }

  private validateModalidad(
    modalidad: MODALIDAD_REUNION | undefined,
    lugarFisico?: string | null,
    urlVirtual?: string | null,
  ) {
    const currentModalidad = modalidad ?? MODALIDAD_REUNION.PRESENCIAL;
    const hasLugar = Boolean(lugarFisico && lugarFisico.trim());
    const hasUrl = Boolean(urlVirtual && urlVirtual.trim());

    if (
      currentModalidad === MODALIDAD_REUNION.PRESENCIAL &&
      hasUrl &&
      !hasLugar
    ) {
      throw new BadRequestException(
        'Para reuniones presenciales, si se informa URL virtual tambien debe informarse lugar fisico.',
      );
    }

    if (currentModalidad === MODALIDAD_REUNION.VIRTUAL && hasLugar && !hasUrl) {
      throw new BadRequestException(
        'Para reuniones virtuales, si se informa lugar fisico tambien debe informarse URL virtual.',
      );
    }
  }

  private normalizeIds(ids: number[]): number[] {
    return Array.from(new Set(ids));
  }

  private async ensureAreasExist(areaIds: number[]) {
    if (areaIds.length === 0) {
      return;
    }

    const count = await this.prisma.area.count({
      where: {
        id: {
          in: areaIds,
        },
        borrado: false,
      },
    });

    if (count !== areaIds.length) {
      throw new NotFoundException('Una o mas areas indicadas no existen.');
    }
  }

  private async ensureRamasExist(ramaIds: number[]) {
    if (ramaIds.length === 0) {
      return;
    }

    const count = await this.prisma.rama.count({
      where: {
        id: {
          in: ramaIds,
        },
        borrado: false,
      },
    });

    if (count !== ramaIds.length) {
      throw new NotFoundException('Una o mas ramas indicadas no existen.');
    }
  }

  private async ensureMiembrosExist(miembroIds: number[]) {
    if (miembroIds.length === 0) {
      return;
    }

    const count = await this.prisma.miembro.count({
      where: {
        id: {
          in: miembroIds,
        },
        borrado: false,
      },
    });

    if (count !== miembroIds.length) {
      throw new NotFoundException('Uno o mas miembros indicados no existen.');
    }
  }

  private async syncAreas(
    tx: Prisma.TransactionClient,
    reunionId: number,
    areaIds: number[],
  ) {
    await tx.areaAfectadaReunion.updateMany({
      where: {
        id_reunion: reunionId,
        borrado: false,
        id_area: {
          notIn: areaIds,
        },
      },
      data: {
        borrado: true,
      },
    });

    const existing = await tx.areaAfectadaReunion.findMany({
      where: {
        id_reunion: reunionId,
        id_area: {
          in: areaIds,
        },
      },
      select: {
        id: true,
        id_area: true,
        borrado: true,
      },
    });

    const existingByAreaId = new Map(
      existing.map((item) => [item.id_area, item]),
    );

    for (const areaId of areaIds) {
      const current = existingByAreaId.get(areaId);

      if (!current) {
        await tx.areaAfectadaReunion.create({
          data: {
            id_reunion: reunionId,
            id_area: areaId,
          },
        });
        continue;
      }

      if (current.borrado) {
        await tx.areaAfectadaReunion.update({
          where: {
            id: current.id,
          },
          data: {
            borrado: false,
          },
        });
      }
    }
  }

  private async syncRamas(
    tx: Prisma.TransactionClient,
    reunionId: number,
    ramaIds: number[],
  ) {
    await tx.ramaAfectadaReunion.updateMany({
      where: {
        id_reunion: reunionId,
        borrado: false,
        id_rama: {
          notIn: ramaIds,
        },
      },
      data: {
        borrado: true,
      },
    });

    const existing = await tx.ramaAfectadaReunion.findMany({
      where: {
        id_reunion: reunionId,
        id_rama: {
          in: ramaIds,
        },
      },
      select: {
        id: true,
        id_rama: true,
        borrado: true,
      },
    });

    const existingByRamaId = new Map(
      existing.map((item) => [item.id_rama, item]),
    );

    for (const ramaId of ramaIds) {
      const current = existingByRamaId.get(ramaId);

      if (!current) {
        await tx.ramaAfectadaReunion.create({
          data: {
            id_reunion: reunionId,
            id_rama: ramaId,
          },
        });
        continue;
      }

      if (current.borrado) {
        await tx.ramaAfectadaReunion.update({
          where: {
            id: current.id,
          },
          data: {
            borrado: false,
          },
        });
      }
    }
  }

  private async syncInvitados(
    tx: Prisma.TransactionClient,
    reunionId: number,
    miembroIds: number[],
  ) {
    await tx.invitadoReunion.updateMany({
      where: {
        id_reunion: reunionId,
        borrado: false,
        id_miembro: {
          notIn: miembroIds,
        },
      },
      data: {
        borrado: true,
      },
    });

    const existing = await tx.invitadoReunion.findMany({
      where: {
        id_reunion: reunionId,
        id_miembro: {
          in: miembroIds,
        },
      },
      select: {
        id: true,
        id_miembro: true,
        borrado: true,
      },
    });

    const existingByMiembroId = new Map(
      existing.map((item) => [item.id_miembro, item]),
    );

    for (const miembroId of miembroIds) {
      const current = existingByMiembroId.get(miembroId);

      if (!current) {
        await tx.invitadoReunion.create({
          data: {
            id_reunion: reunionId,
            id_miembro: miembroId,
          },
        });
        continue;
      }

      if (current.borrado) {
        await tx.invitadoReunion.update({
          where: {
            id: current.id,
          },
          data: {
            borrado: false,
          },
        });
      }
    }
  }

  private reunionListSelect(memberId: number) {
    return {
      id: true,
      borrado: true,
      titulo: true,
      descripcion: true,
      fecha_inicio: true,
      fecha_fin: true,
      modalidad: true,
      lugar_fisico: true,
      url_virtual: true,
      Invitados: {
        where: {
          id_miembro: memberId,
          borrado: false,
        },
        select: {
          id: true,
          asistio: true,
          confirmo: true,
        },
      },
      AreasAfectadas: {
        where: {
          borrado: false,
        },
        select: {
          Area: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
      RamasAfectadas: {
        where: {
          borrado: false,
        },
        select: {
          Rama: {
            select: {
              id: true,
              nombre: true,
              id_area: true,
            },
          },
        },
      },
      _count: {
        select: {
          Invitados: true,
        },
      },
    };
  }

  private reunionDetailSelect(memberId: number) {
    return {
      ...this.reunionListSelect(memberId),
      Invitados: {
        where: {
          borrado: false,
        },
        select: {
          id: true,
          asistio: true,
          confirmo: true,
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
    };
  }
}
