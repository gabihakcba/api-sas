import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeFilterService: ScopeFilterService,
  ) {}

  async findMe(user: AuthenticatedUser) {
    const miembroId = await this.resolveOwnMemberId(user);
    return this.findOne(miembroId, user);
  }

  async findOne(id: number, user: AuthenticatedUser) {
    await this.ensureVisibleMember(id, user);

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id,
        borrado: false,
      },
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
        Protagonista: {
          select: {
            id: true,
            es_becado: true,
            activo: true,
          },
        },
        Adulto: {
          select: {
            id: true,
            es_becado: true,
            activo: true,
          },
        },
        Responsable: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!miembro) {
      throw new NotFoundException('El perfil indicado no existe.');
    }

    return miembro;
  }

  async getAsignacion(id: number, user: AuthenticatedUser) {
    await this.ensureVisibleMember(id, user);

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        Protagonista: {
          select: {
            id: true,
          },
        },
        Adulto: {
          select: {
            id: true,
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
                fecha_inicio: true,
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
                  },
                },
                Posicion: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        },
        MiembroRama: {
          where: {
            borrado: false,
            fecha_egreso: null,
          },
          orderBy: {
            fecha_ingreso: 'desc',
          },
          take: 1,
          select: {
            fecha_ingreso: true,
            Rama: {
              select: {
                id: true,
                nombre: true,
                Area: {
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

    if (!miembro) {
      throw new NotFoundException('El perfil indicado no existe.');
    }

    return {
      ramaActual: miembro.MiembroRama[0] ?? null,
      asignacionAdulto: miembro.Adulto?.EquipoArea[0] ?? null,
      esProtagonista: !!miembro.Protagonista,
      esAdulto: !!miembro.Adulto,
    };
  }

  async getActividad(id: number, user: AuthenticatedUser) {
    await this.ensureVisibleMember(id, user);

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        InscripcionEvento: {
          where: {
            borrado: false,
            Evento: {
              borrado: false,
            },
          },
          orderBy: {
            Evento: {
              fecha_inicio: 'desc',
            },
          },
          select: {
            id: true,
            asistio: true,
            pagado: true,
            saldo_pendiente: true,
            monto_total: true,
            Evento: {
              select: {
                id: true,
                nombre: true,
                fecha_inicio: true,
                fecha_fin: true,
                lugar: true,
                TipoEvento: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
        },
        ParticipantesComision: {
          where: {
            borrado: false,
            Comision: {
              borrado: false,
            },
          },
          orderBy: {
            fecha_inicio: 'desc',
          },
          select: {
            id: true,
            fecha_inicio: true,
            fecha_fin: true,
            Comision: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                Evento: {
                  select: {
                    id: true,
                    nombre: true,
                    fecha_inicio: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!miembro) {
      throw new NotFoundException('El perfil indicado no existe.');
    }

    return miembro;
  }

  async getVinculos(id: number, user: AuthenticatedUser) {
    await this.ensureVisibleMember(id, user);

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        Protagonista: {
          select: {
            Responsabilidad: {
              where: {
                borrado: false,
                Responsable: {
                  borrado: false,
                  Miembro: {
                    borrado: false,
                  },
                },
              },
              select: {
                id: true,
                Relacion: {
                  select: {
                    id: true,
                    tipo: true,
                  },
                },
                Responsable: {
                  select: {
                    id: true,
                    Miembro: {
                      select: {
                        id: true,
                        nombre: true,
                        apellidos: true,
                        dni: true,
                        telefono: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Responsable: {
          select: {
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
                Relacion: {
                  select: {
                    id: true,
                    tipo: true,
                  },
                },
                Protagonista: {
                  select: {
                    id: true,
                    Miembro: {
                      select: {
                        id: true,
                        nombre: true,
                        apellidos: true,
                        dni: true,
                        MiembroRama: {
                          where: {
                            borrado: false,
                            fecha_egreso: null,
                          },
                          orderBy: {
                            fecha_ingreso: 'desc',
                          },
                          take: 1,
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
          },
        },
      },
    });

    if (!miembro) {
      throw new NotFoundException('El perfil indicado no existe.');
    }

    return {
      responsables: miembro.Protagonista?.Responsabilidad ?? [],
      protagonistas: miembro.Responsable?.Responsabilidad ?? [],
    };
  }

  private async resolveOwnMemberId(user: AuthenticatedUser) {
    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id_cuenta: user.userId,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!miembro) {
      throw new NotFoundException('No se encontró un perfil asociado a la cuenta.');
    }

    return miembro.id;
  }

  private async ensureVisibleMember(id: number, user: AuthenticatedUser) {
    const where = this.buildVisibleMemberWhere(id, user);

    const miembro = await this.prisma.miembro.findFirst({
      where,
      select: {
        id: true,
      },
    });

    if (!miembro) {
      throw new NotFoundException('El perfil indicado no existe o no está disponible.');
    }

    return miembro;
  }

  private buildVisibleMemberWhere(
    id: number,
    user: AuthenticatedUser,
  ): Prisma.MiembroWhereInput {
    if (this.hasUnrestrictedAccess(user)) {
      return {
        id,
        borrado: false,
      };
    }

    return {
      id,
      borrado: false,
      OR: [
        {
          id_cuenta: user.userId,
        },
        {
          Protagonista: {
            is: this.mergeSubtypeWhere(
              { borrado: false },
              this.scopeFilterService.forProtagonistas(user),
            ),
          },
        },
        {
          Adulto: {
            is: this.mergeSubtypeWhere(
              { borrado: false },
              this.scopeFilterService.forAdultos(user),
            ),
          },
        },
        {
          Responsable: {
            is: this.mergeSubtypeWhere(
              { borrado: false },
              this.scopeFilterService.forResponsables(user),
            ),
          },
        },
      ],
    };
  }

  private hasUnrestrictedAccess(user: AuthenticatedUser): boolean {
    if (user.roles.some((role) => role === 'ADM' || role === 'OWN')) {
      return true;
    }

    if (user.roles.includes('JEFATURA')) {
      return true;
    }

    return user.scopes.some(
      (scope) =>
        scope.scopeType === SCOPE.GLOBAL ||
        scope.scopeType === SCOPE.GRUPO ||
        scope.scopeType === SCOPE.OWN,
    );
  }

  private mergeSubtypeWhere<TWhere extends object>(
    baseWhere: TWhere,
    scopeWhere: TWhere | Record<string, never>,
  ): TWhere {
    if (Object.keys(scopeWhere).length === 0) {
      return baseWhere;
    }

    return {
      AND: [baseWhere, scopeWhere],
    } as TWhere;
  }
}
