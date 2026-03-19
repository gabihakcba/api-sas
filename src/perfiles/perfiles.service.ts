import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasUnrestrictedAccess } from '../auth/utils/unrestricted-access.util';
import { CuentasService } from '../cuentas/cuentas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UpdatePerfilPersonalDto } from './dto/update-perfil-personal.dto';
import { UpdatePerfilFirmaDto } from './dto/update-perfil-firma.dto';

@Injectable()
export class PerfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeFilterService: ScopeFilterService,
    private readonly cuentasService: CuentasService,
    private readonly authService: AuthService,
  ) {}

  async findMe(user: AuthenticatedUser) {
    const miembroId = await this.resolveOwnMemberId(user);
    return this.findOne(miembroId, user);
  }

  async updateMe(user: AuthenticatedUser, dto: UpdatePerfilPersonalDto) {
    const miembroId = await this.resolveOwnMemberId(user);

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id: miembroId,
        borrado: false,
      },
      select: {
        id: true,
        id_cuenta: true,
      },
    });

    if (!miembro || !miembro.id_cuenta) {
      throw new NotFoundException(
        'No se encontró un perfil asociado a la cuenta.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.cuentasService.updateCuentaConMiembro(
        tx,
        {
          cuentaId: miembro.id_cuenta,
          miembroId: miembro.id,
        },
        {
          ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
          ...(dto.apellidos !== undefined
            ? { apellidos: dto.apellidos.trim() }
            : {}),
          ...(dto.dni !== undefined ? { dni: dto.dni.trim() } : {}),
          ...(dto.fechaNacimiento !== undefined
            ? { fechaNacimiento: dto.fechaNacimiento }
            : {}),
          ...(dto.direccion !== undefined
            ? { direccion: dto.direccion.trim() }
            : {}),
          ...(dto.email !== undefined
            ? { email: dto.email?.trim() || null }
            : {}),
          ...(dto.telefono !== undefined
            ? { telefono: dto.telefono?.trim() || null }
            : {}),
          ...(dto.telefonoEmergencia !== undefined
            ? { telefonoEmergencia: dto.telefonoEmergencia.trim() }
            : {}),
          ...(dto.totem !== undefined
            ? { totem: dto.totem?.trim() || null }
            : {}),
          ...(dto.cualidad !== undefined
            ? { cualidad: dto.cualidad?.trim() || null }
            : {}),
        },
      );
    });

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
            id: true,
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

    const [responsables, protagonistas] = await Promise.all([
      miembro.Protagonista
        ? this.prisma.responsabilidad.findMany({
            where: {
              borrado: false,
              id_protagonista: miembro.Protagonista.id,
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
          })
        : Promise.resolve([]),
      miembro.Responsable
        ? this.prisma.responsabilidad.findMany({
            where: {
              borrado: false,
              id_responsable: miembro.Responsable.id,
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
          })
        : Promise.resolve([]),
    ]);

    return {
      responsables,
      protagonistas,
    };
  }

  async getFirma(id: number, user: AuthenticatedUser) {
    await this.ensureOwnProfile(id, user);

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        id: true,
        firma: true,
      },
    });

    if (!miembro) {
      throw new NotFoundException('El perfil indicado no existe.');
    }

    return {
      firmaBase64: miembro.firma
        ? `data:image/png;base64,${Buffer.from(miembro.firma).toString('base64')}`
        : null,
    };
  }

  async updateFirma(
    id: number,
    dto: UpdatePerfilFirmaDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureOwnProfile(id, user);

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!miembro) {
      throw new NotFoundException('El perfil indicado no existe.');
    }

    const firma = this.parseFirmaBase64(dto.firmaBase64 ?? null);

    await this.prisma.miembro.update({
      where: {
        id: miembro.id,
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

  async syncPermissions(user: AuthenticatedUser) {
    const miembroId = await this.resolveOwnMemberId(user);

    const miembro = await this.prisma.miembro.findUnique({
      where: { id: miembroId },
      include: {
        Adulto: {
          include: {
            EquipoArea: {
              where: { borrado: false, activo: true, fecha_fin: null },
              include: {
                Area: true,
                Posicion: true,
                Rama: true,
              },
            },
          },
        },
        Protagonista: true,
        MiembroRama: {
          where: { borrado: false, fecha_egreso: null },
        },
        Responsable: true,
        Cuenta: true,
      },
    });

    if (!miembro || !miembro.Cuenta) {
      throw new NotFoundException('Miembro o cuenta no encontrada.');
    }

    // Cast explicitly to help the compiler if needed, though findUnique should suffice
    const m = miembro as any;

    return this.prisma.$transaction(async (tx) => {
      // 1. Limpiar roles actuales que son automáticos
      // No borramos roles especiales como ADM, DEV, OWN que se asignan manualmente
      const systemRoles = ['ADM', 'DEV', 'OWN'];
      await tx.cuentaRole.deleteMany({
        where: {
          id_cuenta: m.id_cuenta,
          Role: {
            nombre: {
              notIn: systemRoles,
            },
          },
        },
      });

      // 2. Sincronizar según perfil de Adulto
      if (m.Adulto && m.Adulto.EquipoArea.length > 0) {
        const assignment = m.Adulto.EquipoArea[0];
        try {
          const roleInfo = await this.resolveAdultRole(tx, assignment);

          await tx.cuentaRole.create({
            data: {
              id_cuenta: m.id_cuenta,
              id_role: roleInfo.role.id,
              tipo_scope: roleInfo.scopeType,
              id_scope: roleInfo.scopeId,
            },
          });
        } catch (e) {
          // Si no se puede determinar el rol, ignoramos (ej: área no mapeada)
          console.error('Error resolveAdultRole:', e);
        }
      }

      // 3. Sincronizar según perfil de Protagonista
      if (m.Protagonista && m.MiembroRama.length > 0) {
        const ramaId = m.MiembroRama[0].id_rama;
        const role = await tx.role.findUnique({
          where: { nombre: 'PROTAGONISTA' },
        });

        if (role) {
          await tx.cuentaRole.create({
            data: {
              id_cuenta: m.id_cuenta,
              id_role: role.id,
              tipo_scope: SCOPE.RAMA,
              id_scope: ramaId,
            },
          });
        }
      }

      // 4. Sincronizar según perfil de Responsable
      if (m.Responsable) {
        const role = await tx.role.findUnique({
          where: { nombre: 'RESPONSABLE' },
        });

        if (role) {
          const ramaIds = await this.getResponsableRamaIdsForSync(
            tx,
            m.Responsable.id,
          );
          let scopeType: SCOPE = SCOPE.OWN;
          let scopeId: number | null = null;

          if (ramaIds.length === 1) {
            scopeType = SCOPE.RAMA;
            scopeId = ramaIds[0];
          }

          await tx.cuentaRole.create({
            data: {
              id_cuenta: m.id_cuenta,
              id_role: role.id,
              tipo_scope: scopeType,
              id_scope: scopeId,
            },
          });
        }
      }

      const authData = await this.authService.generateTokenForAccount(
        miembro.id_cuenta,
      );

      return {
        success: true,
        message: 'Permisos sincronizados correctamente.',
        ...authData,
      };
    });
  }

  private async resolveAdultRole(
    tx: Prisma.TransactionClient,
    assignment: Prisma.EquipoAreaGetPayload<{
      include: { Area: true; Posicion: true; Rama: true };
    }>,
  ) {
    let roleName: string | null = null;
    let scopeType: SCOPE = SCOPE.AREA;
    let scopeId: number | null = assignment.id_area;

    if (assignment.Area.nombre === 'Rama') {
      roleName =
        assignment.Posicion.nombre === 'Ayudante'
          ? 'AYUDANTE_RAMA'
          : 'JEFATURA_RAMA';
      scopeType = SCOPE.RAMA;
      scopeId = assignment.id_rama;
    } else if (assignment.Area.nombre === 'Jefatura') {
      roleName =
        assignment.Posicion.nombre === 'Ayudante' ? 'AYUDANTE' : 'JEFATURA';
      scopeType = SCOPE.GRUPO;
      scopeId = null;
    } else if (assignment.Area.nombre === 'Secretaria y Tesoreria') {
      roleName = 'SECRETARIA_TESORERIA';
      scopeType = SCOPE.GRUPO;
      scopeId = null;
    } else if (assignment.Area.nombre === 'Intendencia') {
      roleName = 'INTENDENCIA';
      scopeType = SCOPE.GRUPO;
      scopeId = null;
    }

    if (!roleName) {
      throw new BadRequestException('No se pudo determinar el rol automático.');
    }

    const role = await tx.role.findUnique({ where: { nombre: roleName } });
    if (!role) throw new NotFoundException(`Rol ${roleName} no encontrado.`);

    return { role, scopeType, scopeId };
  }

  private async getResponsableRamaIdsForSync(
    tx: Prisma.TransactionClient,
    responsableId: number,
  ) {
    const responsabilidades = await tx.responsabilidad.findMany({
      where: { id_responsable: responsableId, borrado: false },
      include: {
        Protagonista: {
          include: {
            Miembro: {
              include: {
                MiembroRama: {
                  where: { borrado: false, fecha_egreso: null },
                },
              },
            },
          },
        },
      },
    });

    return [
      ...new Set(
        responsabilidades.flatMap((r) =>
          r.Protagonista.Miembro.MiembroRama.map((mr) => mr.id_rama),
        ),
      ),
    ];
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
      throw new NotFoundException(
        'No se encontró un perfil asociado a la cuenta.',
      );
    }

    return miembro.id;
  }

  private async ensureOwnProfile(id: number, user: AuthenticatedUser) {
    const ownMemberId = await this.resolveOwnMemberId(user);

    if (ownMemberId !== id) {
      throw new BadRequestException(
        'Solo puedes consultar o modificar la firma de tu propio perfil.',
      );
    }
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
      throw new NotFoundException(
        'El perfil indicado no existe o no está disponible.',
      );
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
          Adulto: {
            is: {
              borrado: false,
            },
          },
        },
        {
          Protagonista: {
            is: {
              borrado: false,
              OR: [
                {
                  Miembro: {
                    MiembroRama: {
                      some: {
                        borrado: false,
                        fecha_egreso: null,
                        ...(user.memberId
                          ? {
                              Rama: {
                                EquipoArea: {
                                  some: {
                                    borrado: false,
                                    activo: true,
                                    fecha_fin: null,
                                    Adulto: {
                                      borrado: false,
                                      activo: true,
                                      Miembro: {
                                        id: user.memberId,
                                        borrado: false,
                                      },
                                    },
                                  },
                                },
                              },
                            }
                          : { id_rama: -1 }),
                      },
                    },
                  },
                },
                ...(user.roles.includes('RESPONSABLE')
                  ? [
                      {
                        Responsabilidad: {
                          some: {
                            borrado: false,
                            Responsable: {
                              borrado: false,
                              Miembro: {
                                borrado: false,
                                id_cuenta: user.userId,
                              },
                            },
                          },
                        },
                      } satisfies Prisma.ProtagonistaWhereInput,
                    ]
                  : []),
              ],
            },
          },
        },
        {
          Responsable: {
            is: {
              borrado: false,
              OR: [
                {
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
                              ...(user.memberId
                                ? {
                                    Rama: {
                                      EquipoArea: {
                                        some: {
                                          borrado: false,
                                          activo: true,
                                          fecha_fin: null,
                                          Adulto: {
                                            borrado: false,
                                            activo: true,
                                            Miembro: {
                                              id: user.memberId,
                                              borrado: false,
                                            },
                                          },
                                        },
                                      },
                                    },
                                  }
                                : { id_rama: -1 }),
                            },
                          },
                        },
                      },
                    },
                  },
                },
                ...(user.memberId
                  ? [
                      {
                        Responsabilidad: {
                          some: {
                            borrado: false,
                            Protagonista: {
                              borrado: false,
                              Miembro: {
                                id: user.memberId,
                                borrado: false,
                              },
                            },
                          },
                        },
                      } satisfies Prisma.ResponsableWhereInput,
                    ]
                  : []),
                ...(user.roles.includes('RESPONSABLE')
                  ? [
                      {
                        Responsabilidad: {
                          some: {
                            borrado: false,
                            Protagonista: {
                              borrado: false,
                              Responsabilidad: {
                                some: {
                                  borrado: false,
                                  Responsable: {
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
                      } satisfies Prisma.ResponsableWhereInput,
                    ]
                  : []),
              ],
            },
          },
        },
      ],
    };
  }

  private hasUnrestrictedAccess(user: AuthenticatedUser): boolean {
    return hasUnrestrictedAccess(user);
  }

  private parseFirmaBase64(firmaBase64: string | null) {
    if (!firmaBase64) {
      return null;
    }

    const prefix = 'base64,';
    const index = firmaBase64.indexOf(prefix);
    const rawBase64 =
      index >= 0 ? firmaBase64.slice(index + prefix.length) : firmaBase64;

    try {
      return Buffer.from(rawBase64, 'base64');
    } catch {
      throw new BadRequestException(
        'La firma enviada no tiene un formato válido.',
      );
    }
  }
}
