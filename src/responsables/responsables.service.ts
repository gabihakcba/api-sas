import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasSoftDeleteAuditAccess } from '../auth/utils/unrestricted-access.util';
import { CuentasService } from '../cuentas/cuentas.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResponsableDto } from './dto/create-responsable.dto';
import { ResponsablesQueryDto } from './dto/responsables-query.dto';
import { UpdateResponsabilidadesDto } from './dto/update-responsabilidades.dto';
import { UpdateResponsableDto } from './dto/update-responsable.dto';

@Injectable()
export class ResponsablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cuentasService: CuentasService,
    private readonly scopeFilterService: ScopeFilterService,
  ) {}

  async findAll(user: AuthenticatedUser, query: ResponsablesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const includeDeleted =
      query.includeDeleted === true && hasSoftDeleteAuditAccess(user);
    const searchTerm = query.q?.trim();

    const where = this.scopeFilterService.mergeWhere(
      {
        ...(includeDeleted ? {} : { borrado: false }),
        Miembro: {
          ...(includeDeleted ? {} : { borrado: false }),
          ...(searchTerm
            ? {
                OR: [
                  {
                    nombre: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    apellidos: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    dni: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    email: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    telefono: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    Cuenta: {
                      user: {
                        contains: searchTerm,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      },
      this.scopeFilterService.forResponsables(user),
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.responsable.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          id: 'asc',
        },
        select: this.responsableListSelect(),
      }),
      this.prisma.responsable.count({ where }),
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
    const protagonistas = await this.prisma.protagonista.findMany({
      where: this.scopeFilterService.mergeWhere(
        {
          borrado: false,
          activo: true,
          Miembro: {
            borrado: false,
          },
        },
        this.scopeFilterService.forProtagonistas(user),
      ),
      orderBy: [
        {
          Miembro: {
            apellidos: 'asc',
          },
        },
        {
          Miembro: {
            nombre: 'asc',
          },
        },
      ],
      select: {
        id: true,
        Miembro: {
          select: {
            nombre: true,
            apellidos: true,
            dni: true,
            MiembroRama: {
              where: {
                borrado: false,
                fecha_egreso: null,
              },
              take: 1,
              orderBy: {
                fecha_ingreso: 'desc',
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
        },
      },
    });

    return {
      protagonistas: protagonistas.map((protagonista) => ({
        id: protagonista.id,
        nombre: protagonista.Miembro.nombre,
        apellidos: protagonista.Miembro.apellidos,
        dni: protagonista.Miembro.dni,
        rama: protagonista.Miembro.MiembroRama[0]?.Rama ?? null,
      })),
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const responsable = await this.prisma.responsable.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
          Miembro: {
            borrado: false,
          },
        },
        this.scopeFilterService.forResponsables(user),
      ),
      select: this.responsableDetailSelect(),
    });

    if (!responsable) {
      throw new NotFoundException('El responsable indicado no existe.');
    }

    return responsable;
  }

  async create(dto: CreateResponsableDto, user: AuthenticatedUser) {
    const created = await this.prisma.$transaction(async (tx) => {
      const account = await this.cuentasService.createCuentaConMiembro(tx, dto);
      const responsableRole = await this.ensureResponsableRole(tx);

      await tx.responsable.create({
        data: {
          id_miembro: account.miembroId,
        },
      });

      await this.ensureCuentaDineroResponsable(
        tx,
        account.miembroId,
        dto.nombre,
        dto.apellidos,
      );
      await this.syncResponsableRoleAssignment(
        tx,
        account.cuentaId,
        responsableRole.id,
        null,
      );

      return account;
    });

    return this.findOneByMiembroId(created.miembroId, user);
  }

  async update(id: number, dto: UpdateResponsableDto, user: AuthenticatedUser) {
    const responsable = await this.ensureResponsableAccessible(id, user);

    await this.prisma.$transaction(async (tx) => {
      await this.cuentasService.updateCuentaConMiembro(
        tx,
        {
          cuentaId: responsable.Miembro.Cuenta.id,
          miembroId: responsable.Miembro.id,
        },
        dto,
      );
    });

    return this.findOne(id, user);
  }

  async updateResponsabilidades(
    id: number,
    dto: UpdateResponsabilidadesDto,
    user: AuthenticatedUser,
  ) {
    const responsable = await this.ensureResponsableAccessible(id, user);
    const allowedIds = await this.getAccessibleProtagonistaIds(user, dto.protagonistaIds);
    const relacionId = await this.getDefaultRelacionId();

    await this.prisma.$transaction(async (tx) => {
      const responsableRole = await this.ensureResponsableRole(tx);
      await tx.responsabilidad.updateMany({
        where: {
          id_responsable: responsable.id,
          borrado: false,
          id_protagonista: {
            notIn: allowedIds,
          },
        },
        data: {
          borrado: true,
        },
      });

      const existing = await tx.responsabilidad.findMany({
        where: {
          id_responsable: responsable.id,
          id_protagonista: {
            in: allowedIds,
          },
        },
        select: {
          id: true,
          id_protagonista: true,
          borrado: true,
        },
      });

      const existingMap = new Map(
        existing.map((item) => [item.id_protagonista, item]),
      );

      for (const protagonistaId of allowedIds) {
        const current = existingMap.get(protagonistaId);

        if (!current) {
          await tx.responsabilidad.create({
            data: {
              id_protagonista: protagonistaId,
              id_responsable: responsable.id,
              id_relacion: relacionId,
            },
          });
          continue;
        }

        if (current.borrado) {
          await tx.responsabilidad.update({
            where: { id: current.id },
            data: {
              borrado: false,
              id_relacion: relacionId,
            },
          });
        }
      }

      await this.syncResponsableRoleAssignment(
        tx,
        responsable.Miembro.Cuenta.id,
        responsableRole.id,
        responsable.id,
      );
    });

    return this.findOne(id, user);
  }

  async remove(id: number, user: AuthenticatedUser) {
    const responsable = await this.ensureResponsableAccessible(id, user);

    await this.prisma.$transaction(async (tx) => {
      const responsableRole = await this.ensureResponsableRole(tx);
      await tx.responsabilidad.updateMany({
        where: {
          id_responsable: responsable.id,
          borrado: false,
        },
        data: {
          borrado: true,
        },
      });

      await tx.responsable.update({
        where: { id: responsable.id },
        data: {
          borrado: true,
        },
      });

      await tx.miembro.update({
        where: { id: responsable.Miembro.id },
        data: {
          borrado: true,
        },
      });

      await tx.cuenta.update({
        where: { id: responsable.Miembro.Cuenta.id },
        data: {
          borrado: true,
        },
      });

      await tx.cuentaRole.deleteMany({
        where: {
          id_cuenta: responsable.Miembro.Cuenta.id,
          id_role: responsableRole.id,
        },
      });
    });
  }

  private async ensureResponsableAccessible(id: number, user: AuthenticatedUser) {
    const responsable = await this.prisma.responsable.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
          Miembro: {
            borrado: false,
          },
        },
        this.scopeFilterService.forResponsables(user),
      ),
      select: {
        id: true,
        Miembro: {
          select: {
            id: true,
            Cuenta: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!responsable) {
      throw new NotFoundException('El responsable indicado no existe.');
    }

    return responsable;
  }

  private async findOneByMiembroId(miembroId: number, user: AuthenticatedUser) {
    const responsable = await this.prisma.responsable.findFirst({
      where: {
        id_miembro: miembroId,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!responsable) {
      throw new NotFoundException('El responsable indicado no existe.');
    }

    return this.findOne(responsable.id, user);
  }

  private async getAccessibleProtagonistaIds(
    user: AuthenticatedUser,
    protagonistaIds: number[],
  ) {
    if (protagonistaIds.length === 0) {
      return [];
    }

    const protagonistas = await this.prisma.protagonista.findMany({
      where: this.scopeFilterService.mergeWhere(
        {
          id: {
            in: protagonistaIds,
          },
          borrado: false,
          activo: true,
          Miembro: {
            borrado: false,
          },
        },
        this.scopeFilterService.forProtagonistas(user),
      ),
      select: {
        id: true,
      },
    });

    const allowedIds = protagonistas.map((item) => item.id);

    if (allowedIds.length !== protagonistaIds.length) {
      throw new NotFoundException(
        'Uno o más protagonistas indicados no existen o no están disponibles.',
      );
    }

    return allowedIds;
  }

  private async getDefaultRelacionId() {
    const current = await this.prisma.relacion.findFirst({
      where: {
        tipo: 'Responsable',
      },
      select: {
        id: true,
      },
    });

    if (current) {
      return current.id;
    }

    const created = await this.prisma.relacion.create({
      data: {
        tipo: 'Responsable',
        descripcion: 'Relacion generica para la asignacion de responsables.',
      },
      select: {
        id: true,
      },
    });

    return created.id;
  }

  private async ensureCuentaDineroResponsable(
    tx: Prisma.TransactionClient,
    miembroId: number,
    nombre: string,
    apellidos: string,
  ) {
    const existing = await tx.cuentaDinero.findFirst({
      where: {
        id_miembro: miembroId,
      },
      select: {
        id: true,
      },
    });

    const data = {
      nombre: `Caja ${nombre} ${apellidos}`.trim(),
      descripcion:
        `Cuenta personal del responsable ${nombre} ${apellidos}`.trim(),
      id_miembro: miembroId,
      id_area: null,
      id_rama: null,
      borrado: false,
    };

    if (existing) {
      await tx.cuentaDinero.update({
        where: { id: existing.id },
        data,
      });
      return;
    }

    await tx.cuentaDinero.create({
      data,
    });
  }

  private async ensureResponsableRole(tx: Prisma.TransactionClient) {
    const role = await tx.role.findUnique({
      where: {
        nombre: 'RESPONSABLE',
      },
      select: {
        id: true,
      },
    });

    if (!role) {
      throw new NotFoundException(
        'El rol RESPONSABLE no existe. Ejecuta el seed base para crearlo.',
      );
    }

    return role;
  }

  private async syncResponsableRoleAssignment(
    tx: Prisma.TransactionClient,
    cuentaId: number,
    roleId: number,
    responsableId: number | null,
  ) {
    let scopeType: SCOPE = SCOPE.OWN;
    let scopeId: number | null = null;

    if (responsableId) {
      const ramaIds = await this.getResponsableCurrentRamaIds(tx, responsableId);

      if (ramaIds.length === 1) {
        scopeType = SCOPE.RAMA;
        scopeId = ramaIds[0];
      }
    }

    await tx.cuentaRole.deleteMany({
      where: {
        id_cuenta: cuentaId,
        id_role: roleId,
      },
    });

    await tx.cuentaRole.create({
      data: {
        id_cuenta: cuentaId,
        id_role: roleId,
        tipo_scope: scopeType,
        id_scope: scopeId,
      },
    });
  }

  private async getResponsableCurrentRamaIds(
    tx: Prisma.TransactionClient,
    responsableId: number,
  ) {
    const responsabilidades = await tx.responsabilidad.findMany({
      where: {
        id_responsable: responsableId,
        borrado: false,
        Protagonista: {
          borrado: false,
          Miembro: {
            borrado: false,
            MiembroRama: {
              some: {
                borrado: false,
                fecha_egreso: null,
              },
            },
          },
        },
      },
      select: {
        Protagonista: {
          select: {
            Miembro: {
              select: {
                MiembroRama: {
                  where: {
                    borrado: false,
                    fecha_egreso: null,
                  },
                  select: {
                    id_rama: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return [
      ...new Set(
        responsabilidades.flatMap((responsabilidad) =>
          responsabilidad.Protagonista.Miembro.MiembroRama.map(
            (miembroRama) => miembroRama.id_rama,
          ),
        ),
      ),
    ];
  }

  private responsableListSelect() {
    return {
      id: true,
      borrado: true,
      Miembro: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
          email: true,
          telefono: true,
          borrado: true,
          Cuenta: {
            select: {
              id: true,
              user: true,
            },
          },
        },
      },
      Responsabilidad: {
        where: {
          borrado: false,
          Protagonista: {
            borrado: false,
            Miembro: {
              borrado: false,
            },
          },
        },
        select: {
          id: true,
          Protagonista: {
            select: {
              id: true,
              Miembro: {
                select: {
                  nombre: true,
                  apellidos: true,
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.ResponsableSelect;
  }

  private responsableDetailSelect() {
    return {
      id: true,
      Miembro: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
          fecha_nacimiento: true,
          direccion: true,
          email: true,
          telefono: true,
          telefono_emergencia: true,
          totem: true,
          cualidad: true,
          Cuenta: {
            select: {
              id: true,
              user: true,
            },
          },
        },
      },
      Responsabilidad: {
        where: {
          borrado: false,
          Protagonista: {
            borrado: false,
            Miembro: {
              borrado: false,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          Protagonista: {
            select: {
              id: true,
              Miembro: {
                select: {
                  nombre: true,
                  apellidos: true,
                  dni: true,
                  MiembroRama: {
                    where: {
                      borrado: false,
                      fecha_egreso: null,
                    },
                    take: 1,
                    orderBy: {
                      fecha_ingreso: 'desc',
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
              },
            },
          },
        },
      },
    } satisfies Prisma.ResponsableSelect;
  }
}
