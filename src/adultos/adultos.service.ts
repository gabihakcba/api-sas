import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { CuentasService } from '../cuentas/cuentas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdultosQueryDto } from './dto/adultos-query.dto';
import { CreateAdultoDto } from './dto/create-adulto.dto';
import { UpdateAdultoFirmaDto } from './dto/update-adulto-firma.dto';
import { UpdateAdultoDto } from './dto/update-adulto.dto';

@Injectable()
export class AdultosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cuentasService: CuentasService,
    private readonly scopeFilterService: ScopeFilterService,
  ) {}

  async findAll(user: AuthenticatedUser, paginationQuery: AdultosQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;
    const searchTerm = paginationQuery.q?.trim();

    const scopeWhere = await this.getAdultScopeWhere(user);
    const where = this.scopeFilterService.mergeWhere(
      {
        borrado: false,
        ...(paginationQuery.esBecado !== undefined
          ? { es_becado: paginationQuery.esBecado }
          : {}),
        ...(paginationQuery.activo !== undefined
          ? { activo: paginationQuery.activo }
          : {}),
        Miembro: {
          borrado: false,
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
                    totem: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    cualidad: {
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
        ...((paginationQuery.idArea || paginationQuery.idPosicion || paginationQuery.idRama)
          ? {
              EquipoArea: {
                some: {
                  borrado: false,
                  activo: true,
                  fecha_fin: null,
                  ...(paginationQuery.idArea
                    ? { id_area: paginationQuery.idArea }
                    : {}),
                  ...(paginationQuery.idPosicion
                    ? { id_posicion: paginationQuery.idPosicion }
                    : {}),
                  ...(paginationQuery.idRama
                    ? { id_rama: paginationQuery.idRama }
                    : {}),
                },
              },
            }
          : {}),
      },
      scopeWhere,
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.adulto.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          es_becado: true,
          activo: true,
          Miembro: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              dni: true,
              email: true,
              telefono: true,
              Cuenta: {
                select: {
                  id: true,
                  user: true,
                  CuentaRole: {
                    select: {
                      id: true,
                      tipo_scope: true,
                      id_scope: true,
                      Role: {
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
          EquipoArea: {
            where: {
              borrado: false,
              activo: true,
              fecha_fin: null,
            },
            orderBy: {
              fecha_inicio: 'desc',
            },
            select: {
              id: true,
              fecha_inicio: true,
              Area: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              Posicion: {
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
            },
          },
        },
      }),
      this.prisma.adulto.count({
        where,
      }),
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
    const [areas, posiciones, ramas, roles] = await this.prisma.$transaction([
      this.prisma.area.findMany({
        where: this.scopeFilterService.mergeWhere(
          {
            borrado: false,
          },
          this.scopeFilterService.forAreas(user),
        ),
        orderBy: {
          nombre: 'asc',
        },
        select: {
          id: true,
          nombre: true,
        },
      }),
      this.prisma.posicionArea.findMany({
        orderBy: {
          nombre: 'asc',
        },
        select: {
          id: true,
          nombre: true,
        },
      }),
      this.prisma.rama.findMany({
        where: this.scopeFilterService.mergeWhere(
          {
            borrado: false,
          },
          this.scopeFilterService.forRamas(user),
        ),
        orderBy: {
          nombre: 'asc',
        },
        select: {
          id: true,
          nombre: true,
          id_area: true,
        },
      }),
      this.prisma.role.findMany({
        orderBy: {
          nombre: 'asc',
        },
        select: {
          id: true,
          nombre: true,
        },
      }),
    ]);

    return {
      areas,
      posiciones,
      ramas,
      roles,
      scopes: Object.values(SCOPE),
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const adulto = await this.prisma.adulto.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
          Miembro: {
            borrado: false,
          },
        },
        await this.getAdultScopeWhere(user),
      ),
      select: {
        id: true,
        es_becado: true,
        activo: true,
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
                CuentaRole: {
                  orderBy: {
                    id: 'asc',
                  },
                  select: {
                    id: true,
                    tipo_scope: true,
                    id_scope: true,
                    Role: {
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
        EquipoArea: {
          where: {
            borrado: false,
            activo: true,
            fecha_fin: null,
          },
          orderBy: {
            fecha_inicio: 'desc',
          },
          take: 1,
          select: {
            id: true,
            fecha_inicio: true,
            id_area: true,
            id_posicion: true,
            id_rama: true,
            Area: {
              select: {
                id: true,
                nombre: true,
              },
            },
            Posicion: {
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
          },
        },
      },
    });

    if (!adulto) {
      throw new NotFoundException('El adulto indicado no existe.');
    }

    return adulto;
  }

  async getFirma(id: number, user: AuthenticatedUser) {
    const adulto = await this.prisma.adulto.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
          Miembro: {
            borrado: false,
          },
        },
        await this.getAdultScopeWhere(user),
      ),
      select: {
        id: true,
        Miembro: {
          select: {
            id: true,
            firma: true,
          },
        },
      },
    });

    if (!adulto) {
      throw new NotFoundException('El adulto indicado no existe.');
    }

    return {
      firmaBase64: adulto.Miembro.firma
        ? `data:image/png;base64,${Buffer.from(adulto.Miembro.firma).toString('base64')}`
        : null,
    };
  }

  async updateFirma(
    id: number,
    dto: UpdateAdultoFirmaDto,
    user: AuthenticatedUser,
  ) {
    const adulto = await this.prisma.adulto.findFirst({
      where: {
        id,
        borrado: false,
        Miembro: {
          borrado: false,
          id_cuenta: Number(user.userId),
        },
      },
      select: {
        id: true,
        Miembro: {
          select: {
            id: true,
            id_cuenta: true,
          },
        },
      },
    });

    if (!adulto) {
      throw new BadRequestException(
        'Solo puedes modificar tu propia firma.',
      );
    }

    const firma = this.parseFirmaBase64(dto.firmaBase64 ?? null);

    await this.prisma.miembro.update({
      where: {
        id: adulto.Miembro.id,
      },
      data: {
        firma,
      },
    });

    return {
      firmaBase64: firma
        ? `data:image/png;base64,${Buffer.from(firma).toString('base64')}`
        : null,
    };
  }

  async create(dto: CreateAdultoDto) {
    return this.prisma.$transaction(async (tx) => {
      const resolvedAssignment = await this.resolveAssignment(tx, {
        idArea: dto.idArea,
        idPosicion: dto.idPosicion,
        idRama: dto.idRama,
      });

      if (!dto.idRole && (dto.tipoScope || dto.idScope)) {
        throw new BadRequestException(
          'No se puede asignar un scope sin indicar un rol de cuenta.',
        );
      }

      if (dto.idRole && !dto.tipoScope) {
        throw new BadRequestException(
          'La asignacion de rol requiere indicar el tipo de scope.',
        );
      }

      let role: {
        id: number;
        nombre: string;
      } | null = null;

      if (dto.idRole) {
        role = await tx.role.findUnique({
          where: { id: dto.idRole },
          select: {
            id: true,
            nombre: true,
          },
        });

        if (!role) {
          throw new NotFoundException('El rol indicado no existe.');
        }

        this.validateScopeConfiguration(
          dto,
          role.nombre,
          resolvedAssignment.area.id,
          resolvedAssignment.rama?.id ?? null,
        );

        if (dto.tipoScope === SCOPE.AREA) {
          const scopedArea = await tx.area.findFirst({
            where: {
              id: dto.idScope,
              borrado: false,
            },
            select: { id: true },
          });

          if (!scopedArea) {
            throw new NotFoundException('El area usada como scope no existe.');
          }
        }

        if (dto.tipoScope === SCOPE.RAMA) {
          const scopedRama = await tx.rama.findFirst({
            where: {
              id: dto.idScope,
              borrado: false,
            },
            select: { id: true },
          });

          if (!scopedRama) {
            throw new NotFoundException('La rama usada como scope no existe.');
          }
        }
      }

      if (!role) {
        const derivedRole = await this.resolveAutomaticCuentaRole(tx, {
          areaNombre: resolvedAssignment.area.nombre,
          posicionNombre: resolvedAssignment.posicion.nombre,
          ramaId: resolvedAssignment.rama?.id ?? null,
          areaId: resolvedAssignment.area.id,
        });

        role = derivedRole.role;
        dto.tipoScope = derivedRole.scopeType;
        dto.idScope = derivedRole.scopeId ?? undefined;
      }

      const cuentaMiembro = await this.cuentasService.createCuentaConMiembro(
        tx,
        dto,
      );

      const adulto = await tx.adulto.create({
        data: {
          id_miembro: cuentaMiembro.miembroId,
          es_becado: dto.esBecado ?? false,
          activo: dto.activo ?? true,
        },
        select: {
          id: true,
          es_becado: true,
          activo: true,
        },
      });

      const equipoArea = await tx.equipoArea.create({
        data: {
          id_area: resolvedAssignment.area.id,
          id_adulto: adulto.id,
          id_posicion: resolvedAssignment.posicion.id,
          id_rama: resolvedAssignment.rama?.id,
          fecha_inicio: dto.fechaInicioEquipo ?? new Date(),
        },
        select: {
          id: true,
          fecha_inicio: true,
          activo: true,
        },
      });

      await this.ensureCuentaDineroAdulto(
        tx,
        cuentaMiembro.miembroId,
        dto.nombre,
        dto.apellidos,
      );

      let cuentaRole: {
        id: number;
        tipo_scope: SCOPE;
        id_scope: number | null;
      } | null = null;

      if (role && dto.tipoScope) {
        cuentaRole = await tx.cuentaRole.create({
          data: {
            id_cuenta: cuentaMiembro.cuentaId,
            id_role: role.id,
            tipo_scope: dto.tipoScope,
            id_scope: dto.idScope ?? null,
          },
          select: {
            id: true,
            tipo_scope: true,
            id_scope: true,
          },
        });
      }

      return {
        cuenta: {
          id: cuentaMiembro.cuentaId,
          user: cuentaMiembro.user,
        },
        miembro: {
          id: cuentaMiembro.miembroId,
          nombre: dto.nombre,
          apellidos: dto.apellidos,
          dni: dto.dni,
        },
        adulto,
        area: resolvedAssignment.area,
        posicion: resolvedAssignment.posicion,
        rama: resolvedAssignment.rama,
        equipoArea,
        cuentaRole:
          role && cuentaRole
            ? {
                id: cuentaRole.id,
                role: role.nombre,
                scopeType: cuentaRole.tipo_scope,
                scopeId: cuentaRole.id_scope,
              }
            : null,
      };
    });
  }

  private async getAdultScopeWhere(user: AuthenticatedUser) {
    const baseScopeWhere = this.scopeFilterService.forAdultos(user);

    if (user.roles.includes('RESPONSABLE')) {
      const ramaIds = await this.getResponsableRamaIds(user);

      return {
        OR: [
          {
            EquipoArea: {
              some: {
                borrado: false,
                activo: true,
                fecha_fin: null,
                Area: {
                  borrado: false,
                  nombre: 'Jefatura',
                },
              },
            },
          },
          ...(ramaIds.length > 0
            ? [
                {
                  EquipoArea: {
                    some: {
                      borrado: false,
                      activo: true,
                      fecha_fin: null,
                      id_rama: {
                        in: ramaIds,
                      },
                    },
                  },
                } satisfies Prisma.AdultoWhereInput,
              ]
            : []),
        ],
      };
    }

    return baseScopeWhere;
  }

  private async getResponsableRamaIds(user: AuthenticatedUser) {
    const relaciones = await this.prisma.responsabilidad.findMany({
      where: {
        borrado: false,
        Responsable: {
          borrado: false,
          Miembro: {
            borrado: false,
            id_cuenta: user.userId,
          },
        },
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

    return [...new Set(
      relaciones.flatMap((relacion) =>
        relacion.Protagonista.Miembro.MiembroRama.map((rama) => rama.id_rama),
      ),
    )];
  }

  async update(id: number, dto: UpdateAdultoDto, user: AuthenticatedUser) {
    const adulto = await this.findOne(id, user);
    const currentAssignment = adulto.EquipoArea[0] ?? null;
    const currentCuentaRole = adulto.Miembro.Cuenta.CuentaRole[0] ?? null;

    return this.prisma.$transaction(async (tx) => {
      const resolvedAssignment = await this.resolveAssignment(tx, {
        idArea: dto.idArea ?? currentAssignment?.Area.id,
        idPosicion: dto.idPosicion ?? currentAssignment?.Posicion.id,
        idRama:
          dto.idRama !== undefined
            ? dto.idRama
            : (currentAssignment?.Rama?.id ?? undefined),
      });

      const effectiveDto: CreateAdultoDto = {
        user: dto.user ?? adulto.Miembro.Cuenta.user,
        password: dto.password ?? 'password-temporal',
        nombre: dto.nombre ?? adulto.Miembro.nombre,
        apellidos: dto.apellidos ?? adulto.Miembro.apellidos,
        dni: dto.dni ?? adulto.Miembro.dni,
        fechaNacimiento: dto.fechaNacimiento ?? adulto.Miembro.fecha_nacimiento,
        direccion: dto.direccion ?? adulto.Miembro.direccion,
        email: dto.email ?? adulto.Miembro.email ?? undefined,
        telefono: dto.telefono ?? adulto.Miembro.telefono ?? undefined,
        telefonoEmergencia:
          dto.telefonoEmergencia ?? adulto.Miembro.telefono_emergencia,
        totem: dto.totem ?? adulto.Miembro.totem ?? undefined,
        cualidad: dto.cualidad ?? adulto.Miembro.cualidad ?? undefined,
        idArea: resolvedAssignment.area.id,
        idPosicion: resolvedAssignment.posicion.id,
        idRama: resolvedAssignment.rama?.id,
        fechaInicioEquipo:
          dto.fechaInicioEquipo ??
          currentAssignment?.fecha_inicio ??
          new Date(),
        esBecado: dto.esBecado ?? adulto.es_becado,
        activo: dto.activo ?? adulto.activo,
        idRole: dto.idRole,
        tipoScope: dto.tipoScope,
        idScope: dto.idScope,
      };

      if (
        dto.idRole !== undefined ||
        dto.tipoScope !== undefined ||
        dto.idScope !== undefined
      ) {
        if (!dto.idRole && (dto.tipoScope || dto.idScope)) {
          throw new BadRequestException(
            'No se puede asignar un scope sin indicar un rol de cuenta.',
          );
        }

        if (dto.idRole && !dto.tipoScope) {
          throw new BadRequestException(
            'La asignacion de rol requiere indicar el tipo de scope.',
          );
        }
      }

      let role: {
        id: number;
        nombre: string;
      } | null = null;

      if (dto.idRole) {
        role = await tx.role.findUnique({
          where: { id: dto.idRole },
          select: {
            id: true,
            nombre: true,
          },
        });

        if (!role) {
          throw new NotFoundException('El rol indicado no existe.');
        }

        this.validateScopeConfiguration(
          effectiveDto,
          role.nombre,
          resolvedAssignment.area.id,
          resolvedAssignment.rama?.id ?? null,
        );
      }

      await this.cuentasService.updateCuentaConMiembro(
        tx,
        {
          cuentaId: adulto.Miembro.Cuenta.id,
          miembroId: adulto.Miembro.id,
        },
        {
          user: dto.user,
          password: dto.password,
          nombre: dto.nombre,
          apellidos: dto.apellidos,
          dni: dto.dni,
          fechaNacimiento: dto.fechaNacimiento,
          direccion: dto.direccion,
          email: dto.email,
          telefono: dto.telefono,
          telefonoEmergencia: dto.telefonoEmergencia,
          totem: dto.totem,
          cualidad: dto.cualidad,
        },
      );

      if (dto.esBecado !== undefined || dto.activo !== undefined) {
        await tx.adulto.update({
          where: { id },
          data: {
            ...(dto.esBecado !== undefined ? { es_becado: dto.esBecado } : {}),
            ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
          },
        });
      }

      const assignmentChanged =
        !currentAssignment ||
        resolvedAssignment.area.id !== currentAssignment.Area.id ||
        resolvedAssignment.posicion.id !== currentAssignment.Posicion.id ||
        (resolvedAssignment.rama?.id ?? null) !==
          (currentAssignment.Rama?.id ?? null);

      const shouldDeriveRoleFromAssignment =
        assignmentChanged &&
        (!dto.idRole || dto.idRole === currentCuentaRole?.Role.id);

      if (shouldDeriveRoleFromAssignment) {
        const derivedRole = await this.resolveAutomaticCuentaRole(tx, {
          areaNombre: resolvedAssignment.area.nombre,
          posicionNombre: resolvedAssignment.posicion.nombre,
          ramaId: resolvedAssignment.rama?.id ?? null,
          areaId: resolvedAssignment.area.id,
        });

        role = derivedRole.role;
        dto.idRole = derivedRole.role.id;
        dto.tipoScope = derivedRole.scopeType;
        dto.idScope = derivedRole.scopeId ?? undefined;
      }

      if (currentAssignment && assignmentChanged) {
        await tx.equipoArea.update({
          where: { id: currentAssignment.id },
          data: {
            activo: false,
            fecha_fin: dto.fechaInicioEquipo ?? new Date(),
          },
        });
      }

      if (assignmentChanged) {
        await tx.equipoArea.create({
          data: {
            id_area: resolvedAssignment.area.id,
            id_adulto: id,
            id_posicion: resolvedAssignment.posicion.id,
            id_rama: resolvedAssignment.rama?.id,
            fecha_inicio: dto.fechaInicioEquipo ?? new Date(),
          },
        });
      } else if (currentAssignment && dto.fechaInicioEquipo) {
        await tx.equipoArea.update({
          where: { id: currentAssignment.id },
          data: {
            fecha_inicio: dto.fechaInicioEquipo,
          },
        });
      }

      if (
        dto.idRole !== undefined ||
        dto.tipoScope !== undefined ||
        dto.idScope !== undefined
      ) {
        await tx.cuentaRole.deleteMany({
          where: {
            id_cuenta: adulto.Miembro.Cuenta.id,
          },
        });

        if (role && dto.tipoScope) {
          await tx.cuentaRole.create({
            data: {
              id_cuenta: adulto.Miembro.Cuenta.id,
              id_role: role.id,
              tipo_scope: dto.tipoScope,
              id_scope:
                dto.tipoScope === SCOPE.GLOBAL ||
                dto.tipoScope === SCOPE.GRUPO ||
                dto.tipoScope === SCOPE.OWN
                  ? null
                  : (dto.idScope ?? null),
            },
          });
        }
      }

      return this.findOne(id, user);
    });
  }

  async remove(id: number, user: AuthenticatedUser) {
    const adulto = await this.findOne(id, user);
    const currentAssignment = adulto.EquipoArea[0] ?? null;

    await this.prisma.$transaction(async (tx) => {
      if (currentAssignment) {
        await tx.equipoArea.update({
          where: { id: currentAssignment.id },
          data: {
            activo: false,
            fecha_fin: new Date(),
          },
        });
      }

      await tx.cuentaRole.deleteMany({
        where: {
          id_cuenta: adulto.Miembro.Cuenta.id,
        },
      });

      await tx.adulto.update({
        where: { id },
        data: {
          borrado: true,
          activo: false,
        },
      });

      await tx.miembro.update({
        where: { id: adulto.Miembro.id },
        data: {
          borrado: true,
        },
      });

      await tx.cuenta.update({
        where: { id: adulto.Miembro.Cuenta.id },
        data: {
          borrado: true,
        },
      });
    });
  }

  private async resolveAssignment(
    tx: Prisma.TransactionClient,
    assignment: {
      idArea?: number;
      idPosicion?: number;
      idRama?: number;
    },
  ) {
    if (!assignment.idArea) {
      throw new BadRequestException('Debes indicar un area para el adulto.');
    }

    if (!assignment.idPosicion) {
      throw new BadRequestException(
        'Debes indicar una posicion para el adulto.',
      );
    }

    const area = await tx.area.findFirst({
      where: {
        id: assignment.idArea,
        borrado: false,
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    if (!area) {
      throw new NotFoundException(
        'El area indicada no existe o fue eliminada.',
      );
    }

    const posicion = await tx.posicionArea.findUnique({
      where: { id: assignment.idPosicion },
      select: {
        id: true,
        nombre: true,
      },
    });

    if (!posicion) {
      throw new NotFoundException('La posicion indicada no existe.');
    }

    let rama: { id: number; nombre: string; id_area: number } | null = null;
    if (assignment.idRama) {
      rama = await tx.rama.findFirst({
        where: {
          id: assignment.idRama,
          borrado: false,
        },
        select: {
          id: true,
          nombre: true,
          id_area: true,
        },
      });

      if (!rama) {
        throw new NotFoundException(
          'La rama indicada no existe o fue eliminada.',
        );
      }

      if (rama.id_area !== area.id) {
        throw new BadRequestException(
          'La rama indicada no pertenece al area especificada.',
        );
      }
    }

    if (area.nombre === 'Rama' && !assignment.idRama) {
      throw new BadRequestException(
        'Las asignaciones al area Rama deben indicar una rama.',
      );
    }

    return { area, posicion, rama };
  }

  private async ensureCuentaDineroAdulto(
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
      descripcion: `Cuenta personal del adulto ${nombre} ${apellidos}`.trim(),
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

  private parseFirmaBase64(value: string | null) {
    if (value == null) {
      return null;
    }

    const match = value.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
    const normalized = match ? match[1] : value;

    try {
      const buffer = Buffer.from(normalized, 'base64');

      if (buffer.length === 0) {
        throw new Error('empty');
      }

      return buffer;
    } catch {
      throw new BadRequestException(
        'La firma enviada no tiene un formato de imagen base64 válido.',
      );
    }
  }

  private validateScopeConfiguration(
    dto: CreateAdultoDto,
    roleName: string,
    areaId: number,
    ramaId: number | null,
  ): void {
    if (!dto.tipoScope) {
      throw new BadRequestException(
        'La asignacion de rol requiere un tipo de scope.',
      );
    }

    if (
      dto.tipoScope === SCOPE.GLOBAL ||
      dto.tipoScope === SCOPE.GRUPO ||
      dto.tipoScope === SCOPE.OWN
    ) {
      if (dto.idScope) {
        throw new BadRequestException(
          'Los scopes GLOBAL, GRUPO y OWN no deben incluir idScope.',
        );
      }
    }

    if (dto.tipoScope === SCOPE.AREA) {
      if (!dto.idScope) {
        throw new BadRequestException(
          'El scope AREA requiere un idScope de area.',
        );
      }

      if (dto.idScope !== areaId) {
        throw new BadRequestException(
          'El scope AREA debe apuntar al area de la asignacion actual.',
        );
      }
    }

    if (dto.tipoScope === SCOPE.RAMA) {
      if (!dto.idScope || !ramaId) {
        throw new BadRequestException(
          'El scope RAMA requiere idScope y una rama asociada al adulto.',
        );
      }

      if (dto.idScope !== ramaId) {
        throw new BadRequestException(
          'El scope RAMA debe apuntar a la rama de la asignacion actual.',
        );
      }
    }

    if (
      (roleName === 'JEFATURA_RAMA' || roleName === 'AYUDANTE_RAMA') &&
      dto.tipoScope !== SCOPE.RAMA
    ) {
      throw new BadRequestException(
        'Los roles de rama deben utilizar scope RAMA.',
      );
    }
  }

  private async resolveAutomaticCuentaRole(
    tx: Prisma.TransactionClient,
    assignment: {
      areaNombre: string;
      posicionNombre: string;
      areaId: number;
      ramaId: number | null;
    },
  ): Promise<{
    role: {
      id: number;
      nombre: string;
    };
    scopeType: SCOPE;
    scopeId: number | null;
  }> {
    let roleName: string | null = null;
    let scopeType: SCOPE = SCOPE.AREA;
    let scopeId: number | null = assignment.areaId;

    if (assignment.areaNombre === 'Rama') {
      roleName =
        assignment.posicionNombre === 'Ayudante'
          ? 'AYUDANTE_RAMA'
          : 'JEFATURA_RAMA';
      scopeType = SCOPE.RAMA;
      scopeId = assignment.ramaId;
    } else if (assignment.areaNombre === 'Jefatura') {
      roleName =
        assignment.posicionNombre === 'Ayudante' ? 'AYUDANTE' : 'JEFATURA';
      scopeType = SCOPE.GRUPO;
      scopeId = null;
    } else if (assignment.areaNombre === 'Secretaria y Tesoreria') {
      roleName = 'SECRETARIA_TESORERIA';
      scopeType = SCOPE.GRUPO;
      scopeId = null;
    } else if (assignment.areaNombre === 'Intendencia') {
      roleName = 'INTENDENCIA';
      scopeType = SCOPE.GRUPO;
      scopeId = null;
    }

    if (!roleName) {
      throw new BadRequestException(
        'No se pudo determinar automaticamente el rol para la asignacion indicada.',
      );
    }

    if (scopeType === SCOPE.RAMA && !scopeId) {
      throw new BadRequestException(
        'No se puede asignar un rol de rama sin una rama activa.',
      );
    }

    const role = await tx.role.findUnique({
      where: { nombre: roleName },
      select: {
        id: true,
        nombre: true,
      },
    });

    if (!role) {
      throw new NotFoundException(
        `El rol ${roleName} no existe. Ejecuta el seed base para crearlo.`,
      );
    }

    return {
      role,
      scopeType,
      scopeId,
    };
  }
}
