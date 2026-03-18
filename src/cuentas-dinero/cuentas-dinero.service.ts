import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasUnrestrictedAccess } from '../auth/utils/unrestricted-access.util';
import { PrismaService } from '../prisma/prisma.service';
import { CuentasDineroQueryDto } from './dto/cuentas-dinero-query.dto';
import { CreateCuentaDineroDto } from './dto/create-cuenta-dinero.dto';
import { UpdateCuentaDineroDto } from './dto/update-cuenta-dinero.dto';

@Injectable()
export class CuentasDineroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeFilterService: ScopeFilterService,
  ) {}

  async findAll(user: AuthenticatedUser, paginationQuery: CuentasDineroQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;
    const searchTerm = paginationQuery.q?.trim();

    const where = this.scopeFilterService.mergeWhere(
      {
        borrado: false,
        ...(paginationQuery.idArea ? { id_area: paginationQuery.idArea } : {}),
        ...(paginationQuery.idRama ? { id_rama: paginationQuery.idRama } : {}),
        ...(paginationQuery.idMiembro
          ? { id_miembro: paginationQuery.idMiembro }
          : {}),
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
                  descripcion: {
                    contains: searchTerm,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  Area: {
                    nombre: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
                {
                  Rama: {
                    nombre: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
                {
                  Miembro: {
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
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      this.scopeFilterService.forCuentasDinero(user),
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cuentaDinero.findMany({
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
          monto_actual: true,
          id_area: true,
          id_rama: true,
          id_miembro: true,
          Area: {
            select: {
              id: true,
              nombre: true,
            },
          },
          Rama: {
            select: {
              id: true,
              nombre: true,
              id_area: true,
            },
          },
          Miembro: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              dni: true,
            },
          },
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
      this.prisma.cuentaDinero.count({ where }),
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
    const [areas, ramas, miembros] = await this.prisma.$transaction([
      this.prisma.area.findMany({
        where: this.scopeFilterService.mergeWhere(
          { borrado: false },
          this.scopeFilterService.forAreas(user),
        ),
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
        },
      }),
      this.prisma.rama.findMany({
        where: this.scopeFilterService.mergeWhere(
          { borrado: false },
          this.scopeFilterService.forRamas(user),
        ),
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          id_area: true,
        },
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
    ]);

    return {
      areas,
      ramas,
      miembros,
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const cuenta = await this.prisma.cuentaDinero.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
        },
        this.scopeFilterService.forCuentasDinero(user),
      ),
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        monto_actual: true,
        id_area: true,
        id_rama: true,
        id_miembro: true,
        Area: {
          select: {
            id: true,
            nombre: true,
          },
        },
        Rama: {
          select: {
            id: true,
            nombre: true,
            id_area: true,
          },
        },
        Miembro: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            dni: true,
          },
        },
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

    if (!cuenta) {
      throw new NotFoundException('La cuenta de dinero indicada no existe.');
    }

    return cuenta;
  }

  async create(dto: CreateCuentaDineroDto, user: AuthenticatedUser) {
    const assignment = await this.resolveAssignment(dto);
    await this.validateScopedAccess(user, assignment);
    await this.ensureUniqueName(dto.nombre, null);
    await this.ensureUniqueMemberAssignment(assignment.idMiembro);

    return this.prisma.cuentaDinero.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        monto_actual: new Prisma.Decimal(dto.montoActual),
        id_area: assignment.idArea ?? null,
        id_rama: assignment.idRama ?? null,
        id_miembro: assignment.idMiembro ?? null,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        monto_actual: true,
        id_area: true,
        id_rama: true,
        id_miembro: true,
        Area: {
          select: {
            id: true,
            nombre: true,
          },
        },
        Rama: {
          select: {
            id: true,
            nombre: true,
            id_area: true,
          },
        },
        Miembro: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            dni: true,
          },
        },
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

  async update(
    id: number,
    dto: UpdateCuentaDineroDto,
    user: AuthenticatedUser,
  ) {
    const existing = await this.findOne(id, user);

    const assignment = await this.resolveAssignment({
      idArea: dto.idArea ?? existing.id_area ?? undefined,
      idRama: dto.idRama ?? existing.id_rama ?? undefined,
      idMiembro: dto.idMiembro ?? existing.id_miembro ?? undefined,
    });

    await this.validateScopedAccess(user, assignment);
    await this.ensureUniqueName(dto.nombre ?? existing.nombre, id);
    await this.ensureUniqueMemberAssignment(assignment.idMiembro, id);

    return this.prisma.cuentaDinero.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion.trim() || null }
          : {}),
        ...(dto.montoActual !== undefined
          ? { monto_actual: new Prisma.Decimal(dto.montoActual) }
          : {}),
        id_area: assignment.idArea ?? null,
        id_rama: assignment.idRama ?? null,
        id_miembro: assignment.idMiembro ?? null,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        monto_actual: true,
        id_area: true,
        id_rama: true,
        id_miembro: true,
        Area: {
          select: {
            id: true,
            nombre: true,
          },
        },
        Rama: {
          select: {
            id: true,
            nombre: true,
            id_area: true,
          },
        },
        Miembro: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            dni: true,
          },
        },
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

  async remove(id: number, user: AuthenticatedUser) {
    await this.findOne(id, user);

    await this.prisma.cuentaDinero.update({
      where: { id },
      data: {
        borrado: true,
      },
    });
  }

  private async ensureUniqueName(name: string, currentId: number | null) {
    const existing = await this.prisma.cuentaDinero.findFirst({
      where: {
        nombre: name.trim(),
        borrado: false,
        ...(currentId ? { NOT: { id: currentId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una cuenta de dinero activa con ese nombre.',
      );
    }
  }

  private async ensureUniqueMemberAssignment(
    miembroId?: number,
    currentId?: number,
  ) {
    if (!miembroId) {
      return;
    }

    const existing = await this.prisma.cuentaDinero.findFirst({
      where: {
        id_miembro: miembroId,
        borrado: false,
        ...(currentId ? { NOT: { id: currentId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ese miembro ya tiene una cuenta de dinero activa asignada.',
      );
    }
  }

  private async resolveAssignment(input: {
    idArea?: number;
    idRama?: number;
    idMiembro?: number;
  }): Promise<{ idArea?: number; idRama?: number; idMiembro?: number }> {
    const assignmentCount = [input.idArea, input.idRama, input.idMiembro].filter(
      (value) => value !== undefined && value !== null,
    ).length;

    if (assignmentCount > 1) {
      throw new BadRequestException(
        'La cuenta de dinero debe pertenecer a un area, una rama o un miembro, no a multiples asignaciones.',
      );
    }

    if (assignmentCount === 0) {
      throw new BadRequestException(
        'Debes indicar un area, una rama o un miembro para la cuenta de dinero.',
      );
    }

    if (input.idArea) {
      const area = await this.prisma.area.findFirst({
        where: {
          id: input.idArea,
          borrado: false,
        },
        select: { id: true },
      });

      if (!area) {
        throw new NotFoundException('El area indicada no existe.');
      }

      return { idArea: area.id };
    }

    if (input.idMiembro) {
      const miembro = await this.prisma.miembro.findFirst({
        where: {
          id: input.idMiembro,
          borrado: false,
        },
        select: {
          id: true,
        },
      });

      if (!miembro) {
        throw new NotFoundException('El miembro indicado no existe.');
      }

      return { idMiembro: miembro.id };
    }

    const rama = await this.prisma.rama.findFirst({
      where: {
        id: input.idRama,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!rama) {
      throw new NotFoundException('La rama indicada no existe.');
    }

    return { idRama: rama.id };
  }

  private async validateScopedAccess(
    user: AuthenticatedUser,
    assignment: { idArea?: number; idRama?: number; idMiembro?: number },
  ) {
    const scopedWhere = this.scopeFilterService.forCuentasDinero(user);

    if (Object.keys(scopedWhere).length === 0) {
      return;
    }

    const allowed = await this.prisma.cuentaDinero.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          borrado: false,
          ...(assignment.idArea ? { id_area: assignment.idArea } : {}),
          ...(assignment.idRama ? { id_rama: assignment.idRama } : {}),
          ...(assignment.idMiembro ? { id_miembro: assignment.idMiembro } : {}),
        },
        scopedWhere,
      ),
      select: { id: true },
    });

    if (!allowed) {
      if (assignment.idArea) {
        const areaMatch = await this.prisma.area.findFirst({
          where: this.scopeFilterService.mergeWhere(
            { id: assignment.idArea, borrado: false },
            this.scopeFilterService.forAreas(user),
          ),
          select: { id: true },
        });

        if (areaMatch) {
          return;
        }
      }

      if (assignment.idRama) {
        const ramaMatch = await this.prisma.rama.findFirst({
          where: this.scopeFilterService.mergeWhere(
            { id: assignment.idRama, borrado: false },
            this.scopeFilterService.forRamas(user),
          ),
          select: { id: true },
        });

        if (ramaMatch) {
          return;
        }
      }

      if (assignment.idMiembro) {
        const miembroMatch = await this.prisma.miembro.findFirst({
          where: this.buildVisibleMiembroWhere(user, assignment.idMiembro),
          select: { id: true },
        });

        if (miembroMatch) {
          return;
        }
      }

      throw new ForbiddenException(
        'El usuario no posee un scope valido para esta cuenta de dinero.',
      );
    }
  }

  private buildVisibleMiembroWhere(
    user: AuthenticatedUser,
    onlyMemberId?: number,
  ): Prisma.MiembroWhereInput {
    if (hasUnrestrictedAccess(user)) {
      return {
        borrado: false,
        ...(onlyMemberId ? { id: onlyMemberId } : {}),
      };
    }

    const filters: Prisma.MiembroWhereInput[] = [];

    for (const scope of user.scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      const isAdultScopedRole = ['JEFATURA_RAMA', 'AYUDANTE_RAMA', 'INTENDENCIA'].includes(
        scope.role,
      );

      if (!isAdultScopedRole) {
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

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          OR: [
            {
              MiembroRama: {
                some: {
                  borrado: false,
                  fecha_egreso: null,
                  Rama: {
                    id_area: scope.scopeId,
                    borrado: false,
                  },
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
                      borrado: false,
                      activo: true,
                      fecha_fin: null,
                      OR: [
                        { id_area: scope.scopeId },
                        {
                          Rama: {
                            id_area: scope.scopeId,
                            borrado: false,
                          },
                        },
                      ],
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
                              borrado: false,
                              fecha_egreso: null,
                              Rama: {
                                id_area: scope.scopeId,
                                borrado: false,
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
    }

    if (filters.length === 0) {
      return {
        id: -1,
        borrado: false,
      };
    }

    return {
      AND: [
        { borrado: false },
        ...(onlyMemberId ? [{ id: onlyMemberId }] : []),
        filters.length === 1 ? filters[0] : { OR: filters },
      ],
    };
  }
}
