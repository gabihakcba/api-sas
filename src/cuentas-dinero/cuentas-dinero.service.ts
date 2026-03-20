import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SCOPE,
  TIPO_MOVIMIENTO_CUENTA,
} from '@prisma/client';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import {
  hasSoftDeleteAuditAccess,
  hasUnrestrictedAccess,
} from '../auth/utils/unrestricted-access.util';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CuentasDineroQueryDto } from './dto/cuentas-dinero-query.dto';
import { CreateCuentaDineroDto } from './dto/create-cuenta-dinero.dto';
import { CreateMovimientoCuentaAdjuntosDto } from './dto/create-movimiento-cuenta-adjuntos.dto';
import {
  CreateMovimientoCuentaDto,
  CreateMovimientoCuentaAdjuntoDto,
} from './dto/create-movimiento-cuenta.dto';
import { MovimientosCuentaQueryDto } from './dto/movimientos-cuenta-query.dto';
import { UpdateCuentaDineroDto } from './dto/update-cuenta-dinero.dto';

type PrismaTx = Prisma.TransactionClient;
const CUENTA_DINERO_GROUP_READ_WRITE_ROLES = new Set([
  'ADM',
  'DEV',
  'JEFATURA',
  'SECRETARIA_TESORERIA',
]);
const CUENTA_DINERO_BRANCH_EDUCATOR_ROLES = new Set([
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
]);
const CUENTA_DINERO_ADULT_READ_ROLES = new Set([
  'ADM',
  'DEV',
  'AYUDANTE',
  'JEFATURA',
  'SECRETARIA_TESORERIA',
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
  'OWN',
]);

interface CuentaAuditSnapshot {
  id: number;
  nombre: string;
  descripcion: string | null;
  monto_actual: string;
  borrado?: boolean;
  area: unknown;
  rama: unknown;
  miembro: unknown;
}

interface MovimientoCuentaAuditSnapshot {
  id: number;
  cuenta: unknown;
  responsable: unknown;
  metodoPago: unknown;
  monto: string;
  tipo: TIPO_MOVIMIENTO_CUENTA;
  detalles: string | null;
  fecha_movimiento: Date;
  saldo_anterior: string;
  saldo_posterior: string;
  codigo_referencia: string;
  borrado: boolean;
  createdAt: Date;
  adjuntos: Array<{
    id: number;
    nombre: string;
    mime: string;
    borrado: boolean;
  }>;
}

interface MovimientoCuentaAdjuntoAuditSnapshot {
  id: number;
  nombre: string;
  mime: string;
  movimientoId: number;
  createdAt: Date;
}

@Injectable()
export class CuentasDineroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeFilterService: ScopeFilterService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    user: AuthenticatedUser,
    paginationQuery: CuentasDineroQueryDto,
  ) {
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
        select: this.cuentaSummarySelect(),
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
    const [areas, ramas, miembros, metodos] = await this.prisma.$transaction([
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
      this.prisma.metodoPago.findMany({
        where: { borrado: false },
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
        },
      }),
    ]);

    return {
      areas,
      ramas,
      miembros,
      metodos,
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const cuenta = await this.findCuentaAccessRecord(id);

    if (!cuenta) {
      throw new NotFoundException('La cuenta de dinero indicada no existe.');
    }

    this.assertCuentaReadAccess(cuenta, user);

    return cuenta;
  }

  async getMovimientosOptions(id: number, user: AuthenticatedUser) {
    await this.findOne(id, user);

    const [responsableActual, metodos] = await this.prisma.$transaction([
      this.prisma.miembro.findFirst({
        where: user.memberId
          ? {
              id: user.memberId,
              borrado: false,
            }
          : {
              id: -1,
            },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
        },
      }),
      this.prisma.metodoPago.findMany({
        where: { borrado: false },
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
        },
      }),
    ]);

    return {
      responsableActual,
      metodos,
      tipos: Object.values(TIPO_MOVIMIENTO_CUENTA),
    };
  }

  async findMovimientos(
    idCuenta: number,
    user: AuthenticatedUser,
    paginationQuery: MovimientosCuentaQueryDto,
  ) {
    await this.findOne(idCuenta, user);

    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;
    const searchTerm = paginationQuery.q?.trim();
    const includeDeleted =
      paginationQuery.includeDeleted === true && hasSoftDeleteAuditAccess(user);

    const where = {
      id_cuenta_dinero: idCuenta,
      ...(includeDeleted ? {} : { borrado: false }),
      ...(paginationQuery.idResponsable
        ? { id_responsable: paginationQuery.idResponsable }
        : {}),
      ...(paginationQuery.idMetodoPago
        ? { id_metodo_pago: paginationQuery.idMetodoPago }
        : {}),
      ...(paginationQuery.tipo ? { tipo: paginationQuery.tipo } : {}),
      ...(searchTerm
        ? {
            OR: [
              {
                detalles: {
                  contains: searchTerm,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                codigo_referencia: {
                  contains: searchTerm,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                Responsable: {
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
              {
                MetodoPago: {
                  nombre: {
                    contains: searchTerm,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            ],
          }
        : {}),
    } satisfies Prisma.MovimientoCuentaWhereInput;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.movimientoCuenta.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fecha_movimiento: 'desc' }, { id: 'desc' }],
        select: this.movimientoSelect(),
      }),
      this.prisma.movimientoCuenta.count({ where }),
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
      select: this.cuentaSummarySelect(),
    });
  }

  async createMovimiento(
    idCuenta: number,
    dto: CreateMovimientoCuentaDto,
    user: AuthenticatedUser,
    logId?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cuenta = await this.findCuentaWithinClient(tx, idCuenta, user);

      if (!cuenta) {
        throw new NotFoundException('La cuenta de dinero indicada no existe.');
      }

      this.assertCuentaManageAccess(cuenta, user);

      if (!user.memberId) {
        throw new ForbiddenException(
          'No se pudo determinar el miembro responsable del usuario autenticado.',
        );
      }

      const responsable = await tx.miembro.findFirst({
        where: this.buildVisibleMiembroWhere(user, user.memberId),
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
        },
      });

      if (!responsable) {
        throw new NotFoundException('El responsable indicado no existe.');
      }

      const metodoPago = await tx.metodoPago.findFirst({
        where: {
          id: dto.idMetodoPago,
          borrado: false,
        },
        select: {
          id: true,
          nombre: true,
        },
      });

      if (!metodoPago) {
        throw new NotFoundException('El metodo de pago indicado no existe.');
      }

      const monto = new Prisma.Decimal(dto.monto);

      if (monto.isZero()) {
        throw new BadRequestException(
          'El monto del movimiento no puede ser igual a cero.',
        );
      }

      const tipo = monto.greaterThan(0)
        ? TIPO_MOVIMIENTO_CUENTA.INGRESO
        : TIPO_MOVIMIENTO_CUENTA.EGRESO;
      const saldoAnterior = new Prisma.Decimal(cuenta.monto_actual);
      const saldoPosterior = saldoAnterior.add(monto);
      const cuentaPre = this.toCuentaAuditSnapshot(cuenta);

      const created = await tx.movimientoCuenta.create({
        data: {
          monto,
          tipo,
          detalles: dto.detalles?.trim() || null,
          fecha_movimiento: dto.fechaMovimiento ?? new Date(),
          saldo_anterior: saldoAnterior,
          saldo_posterior: saldoPosterior,
          id_cuenta_dinero: idCuenta,
          id_responsable: responsable.id,
          id_metodo_pago: dto.idMetodoPago,
          Adjuntos: dto.adjuntos?.length
            ? {
                create: dto.adjuntos.map((adjunto) =>
                  this.mapAdjuntoCreateInput(adjunto),
                ),
              }
            : undefined,
        },
        select: {
          id: true,
        },
      });

      await tx.cuentaDinero.update({
        where: { id: idCuenta },
        data: {
          monto_actual: saldoPosterior,
        },
      });

      const [createdMovimiento, cuentaPost] = await Promise.all([
        this.findMovimientoWithinClient(tx, created.id),
        this.findCuentaWithinClient(tx, idCuenta, user),
      ]);

      if (!createdMovimiento || !cuentaPost) {
        throw new NotFoundException(
          'No se pudo recuperar el movimiento creado para la auditoria.',
        );
      }

      await this.auditService.recordAction({
        logId,
        tabla: 'MovimientoCuenta',
        preRegistro: null,
        postRegistro: this.toMovimientoAuditSnapshot(createdMovimiento),
      });
      await this.auditService.recordAction({
        logId,
        tabla: 'CuentaDinero',
        preRegistro: cuentaPre,
        postRegistro: this.toCuentaAuditSnapshot(cuentaPost),
      });

      return createdMovimiento;
    });
  }

  async removeMovimiento(
    idCuenta: number,
    idMovimiento: number,
    user: AuthenticatedUser,
    logId?: number,
  ) {
    const cuenta = await this.findOne(idCuenta, user);
    const existing = await this.findMovimiento(idCuenta, idMovimiento, user, true);
    this.assertCuentaManageAccess(cuenta, user);

    if (existing.borrado) {
      throw new BadRequestException(
        'El movimiento indicado ya fue eliminado logicamente.',
      );
    }

    const cuentaPre = this.toCuentaAuditSnapshot(cuenta);
    const movimientoPre = this.toMovimientoAuditSnapshot(existing);
    const saldoPosterior = new Prisma.Decimal(cuenta.monto_actual).sub(
      new Prisma.Decimal(existing.monto),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.movimientoCuentaAdjunto.updateMany({
        where: {
          id_movimiento_cuenta: idMovimiento,
          borrado: false,
        },
        data: {
          borrado: true,
        },
      });

      await tx.movimientoCuenta.update({
        where: {
          id: idMovimiento,
        },
        data: {
          borrado: true,
        },
      });

      await tx.cuentaDinero.update({
        where: { id: idCuenta },
        data: {
          monto_actual: saldoPosterior,
        },
      });
    });

    const [cuentaPost, movimientoPost] = await Promise.all([
      this.findOne(idCuenta, user),
      this.findMovimiento(idCuenta, idMovimiento, user, true),
    ]);

    await this.auditService.recordAction({
      logId,
      tabla: 'MovimientoCuenta',
      preRegistro: movimientoPre,
      postRegistro: this.toMovimientoAuditSnapshot(movimientoPost),
    });
    await this.auditService.recordAction({
      logId,
      tabla: 'CuentaDinero',
      preRegistro: cuentaPre,
      postRegistro: this.toCuentaAuditSnapshot(cuentaPost),
    });
  }

  async addMovimientoAdjuntos(
    idCuenta: number,
    idMovimiento: number,
    dto: CreateMovimientoCuentaAdjuntosDto,
    user: AuthenticatedUser,
    logId?: number,
  ) {
    if (!dto.adjuntos.length) {
      throw new BadRequestException(
        'Debes indicar al menos un adjunto para agregar al movimiento.',
      );
    }

    const cuenta = await this.findOne(idCuenta, user);
    this.assertCuentaManageAccess(cuenta, user);
    const existing = await this.findMovimiento(idCuenta, idMovimiento, user, true);

    if (existing.borrado) {
      throw new BadRequestException(
        'No se pueden agregar adjuntos a un movimiento borrado logicamente.',
      );
    }

    const preRegistro = this.toMovimientoAuditSnapshot(existing);

    await this.prisma.$transaction(async (tx) => {
      await tx.movimientoCuentaAdjunto.createMany({
        data: dto.adjuntos.map((adjunto) => ({
          ...this.mapAdjuntoCreateInput(adjunto),
          id_movimiento_cuenta: idMovimiento,
        })),
      });
    });

    const updated = await this.findMovimiento(idCuenta, idMovimiento, user, true);

    await this.auditService.recordAction({
      logId,
      tabla: 'MovimientoCuenta',
      preRegistro,
      postRegistro: this.toMovimientoAuditSnapshot(updated),
    });

    return updated;
  }

  async getMovimientoAdjunto(
    idCuenta: number,
    idMovimiento: number,
    idAdjunto: number,
    user: AuthenticatedUser,
  ) {
    await this.findMovimiento(idCuenta, idMovimiento, user, true);

    const adjunto = await this.prisma.movimientoCuentaAdjunto.findFirst({
      where: {
        id: idAdjunto,
        borrado: false,
        id_movimiento_cuenta: idMovimiento,
        MovimientoCuenta: {
          id_cuenta_dinero: idCuenta,
        },
      },
      select: {
        archivo: true,
        mime: true,
        nombre: true,
      },
    });

    if (!adjunto) {
      throw new NotFoundException('El adjunto indicado no existe.');
    }

    return {
      buffer: Buffer.from(adjunto.archivo),
      mimeType: adjunto.mime,
      filename: adjunto.nombre,
    };
  }

  async removeMovimientoAdjunto(
    idCuenta: number,
    idMovimiento: number,
    idAdjunto: number,
    user: AuthenticatedUser,
    logId?: number,
  ) {
    const cuenta = await this.findOne(idCuenta, user);
    this.assertCuentaManageAccess(cuenta, user);
    const movimiento = await this.findMovimiento(idCuenta, idMovimiento, user, true);

    if (movimiento.borrado) {
      throw new BadRequestException(
        'No se pueden borrar adjuntos de un movimiento borrado logicamente.',
      );
    }

    const adjunto = await this.prisma.movimientoCuentaAdjunto.findFirst({
      where: {
        id: idAdjunto,
        id_movimiento_cuenta: idMovimiento,
        MovimientoCuenta: {
          id_cuenta_dinero: idCuenta,
        },
      },
      select: {
        id: true,
        nombre: true,
        mime: true,
        createdAt: true,
        id_movimiento_cuenta: true,
      },
    });

    if (!adjunto) {
      throw new NotFoundException('El adjunto indicado no existe.');
    }

    const movimientoPre = this.toMovimientoAuditSnapshot(movimiento);
    const adjuntoPre = this.toMovimientoAdjuntoAuditSnapshot(adjunto);

    await this.prisma.movimientoCuentaAdjunto.delete({
      where: {
        id: idAdjunto,
      },
    });

    const movimientoPost = await this.findMovimiento(idCuenta, idMovimiento, user, true);

    await this.auditService.recordAction({
      logId,
      tabla: 'MovimientoCuentaAdjunto',
      preRegistro: adjuntoPre,
      postRegistro: null,
    });
    await this.auditService.recordAction({
      logId,
      tabla: 'MovimientoCuenta',
      preRegistro: movimientoPre,
      postRegistro: this.toMovimientoAuditSnapshot(movimientoPost),
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
      select: this.cuentaSummarySelect(),
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

  async findMovimiento(
    idCuenta: number,
    idMovimiento: number,
    user: AuthenticatedUser,
    includeDeleted = false,
  ) {
    await this.findOne(idCuenta, user);

    const movimiento = await this.prisma.movimientoCuenta.findFirst({
      where: {
        id: idMovimiento,
        id_cuenta_dinero: idCuenta,
        ...(includeDeleted ? {} : { borrado: false }),
      },
      select: this.movimientoSelect(),
    });

    if (!movimiento) {
      throw new NotFoundException('El movimiento indicado no existe.');
    }

    return movimiento;
  }

  private cuentaSummarySelect() {
    return {
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
          MovimientoCuenta: {
            where: {
              borrado: false,
            },
          },
        },
      },
    } satisfies Prisma.CuentaDineroSelect;
  }

  private cuentaDetailSelect() {
    return {
      ...this.cuentaSummarySelect(),
      createdAt: true,
      updatedAt: true,
    } satisfies Prisma.CuentaDineroSelect;
  }

  private cuentaAccessSelect() {
    return {
      ...this.cuentaDetailSelect(),
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
            select: {
              id_rama: true,
            },
          },
          Responsable: {
            select: {
              id: true,
              Responsabilidad: {
                where: {
                  borrado: false,
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
              },
            },
          },
        },
      },
    } satisfies Prisma.CuentaDineroSelect;
  }

  private movimientoSelect() {
    return {
      id: true,
      monto: true,
      tipo: true,
      detalles: true,
      fecha_movimiento: true,
      saldo_anterior: true,
      saldo_posterior: true,
      codigo_referencia: true,
      borrado: true,
      createdAt: true,
      updatedAt: true,
      Responsable: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
        },
      },
      MetodoPago: {
        select: {
          id: true,
          nombre: true,
        },
      },
      CuentaDinero: {
        select: {
          id: true,
          nombre: true,
        },
      },
      Adjuntos: {
        where: {
          borrado: false,
        },
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          nombre: true,
          mime: true,
          createdAt: true,
        },
      },
    } satisfies Prisma.MovimientoCuentaSelect;
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
    const assignmentCount = [
      input.idArea,
      input.idRama,
      input.idMiembro,
    ].filter((value) => value !== undefined && value !== null).length;

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

      const isAdultScopedRole = [
        'JEFATURA_RAMA',
        'AYUDANTE_RAMA',
        'INTENDENCIA',
      ].includes(scope.role);

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

  private async findCuentaWithinClient(
    tx: PrismaTx,
    id: number,
    user: AuthenticatedUser,
  ) {
    const cuenta = await tx.cuentaDinero.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: this.cuentaAccessSelect(),
    });

    if (!cuenta) {
      return null;
    }

    this.assertCuentaReadAccess(cuenta, user);

    return cuenta;
  }

  private async findCuentaAccessRecord(id: number) {
    return this.prisma.cuentaDinero.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: this.cuentaAccessSelect(),
    });
  }

  private hasCuentaDineroGroupAccess(user: AuthenticatedUser) {
    return user.scopes.some(
      (scope) =>
        CUENTA_DINERO_GROUP_READ_WRITE_ROLES.has(scope.role) &&
        (scope.scopeType === SCOPE.GRUPO || scope.scopeType === SCOPE.GLOBAL),
    );
  }

  private hasCuentaDineroAdultReadAccess(user: AuthenticatedUser) {
    return user.scopes.some((scope) =>
      CUENTA_DINERO_ADULT_READ_ROLES.has(scope.role),
    );
  }

  private isGroupCashAccount(
    cuenta: NonNullable<Awaited<ReturnType<CuentasDineroService['findCuentaAccessRecord']>>>,
  ) {
    return (
      cuenta.id_miembro === null &&
      cuenta.id_rama === null &&
      cuenta.Area?.nombre === 'Jefatura'
    );
  }

  private getCuentaRelatedBranchIds(
    cuenta: NonNullable<Awaited<ReturnType<CuentasDineroService['findCuentaAccessRecord']>>>,
  ) {
    const branchIds = new Set<number>();

    if (cuenta.id_rama) {
      branchIds.add(cuenta.id_rama);
    }

    for (const rama of cuenta.Miembro?.MiembroRama ?? []) {
      branchIds.add(rama.id_rama);
    }

    for (const responsabilidad of cuenta.Miembro?.Responsable?.Responsabilidad ?? []) {
      for (const rama of responsabilidad.Protagonista.Miembro.MiembroRama) {
        branchIds.add(rama.id_rama);
      }
    }

    return branchIds;
  }

  private assertCuentaReadAccess(
    cuenta: NonNullable<Awaited<ReturnType<CuentasDineroService['findCuentaAccessRecord']>>>,
    user: AuthenticatedUser,
  ) {
    if (this.hasCuentaDineroGroupAccess(user)) {
      return;
    }

    if (this.isGroupCashAccount(cuenta) && this.hasCuentaDineroAdultReadAccess(user)) {
      return;
    }

    const branchIds = this.getCuentaRelatedBranchIds(cuenta);

    const hasBranchAccess = user.scopes.some(
      (scope) =>
        CUENTA_DINERO_BRANCH_EDUCATOR_ROLES.has(scope.role) &&
        scope.scopeType === SCOPE.RAMA &&
        scope.scopeId !== null &&
        branchIds.has(scope.scopeId),
    );

    if (!hasBranchAccess) {
      throw new ForbiddenException(
        'El usuario no posee acceso financiero a esta cuenta de dinero.',
      );
    }
  }

  private assertCuentaManageAccess(
    cuenta: NonNullable<Awaited<ReturnType<CuentasDineroService['findCuentaAccessRecord']>>>,
    user: AuthenticatedUser,
  ) {
    if (this.isGroupCashAccount(cuenta)) {
      if (!this.hasCuentaDineroGroupAccess(user)) {
        throw new ForbiddenException(
          'Solo la jefatura o tesoreria de grupo puede modificar la cuenta de grupo.',
        );
      }
    }
  }

  private async findMovimientoWithinClient(tx: PrismaTx, id: number) {
    return tx.movimientoCuenta.findFirst({
      where: {
        id,
      },
      select: this.movimientoSelect(),
    });
  }

  private mapAdjuntoCreateInput(adjunto: CreateMovimientoCuentaAdjuntoDto) {
    const parsed = this.parseBase64Attachment(adjunto.archivoBase64);

    return {
      archivo: parsed.buffer,
      mime: adjunto.mimeType.trim(),
      nombre: adjunto.nombre.trim() || 'adjunto-movimiento',
    };
  }

  private parseBase64Attachment(value: string) {
    const normalized = value.trim();
    const content = normalized.includes(',')
      ? normalized.split(',').pop() ?? ''
      : normalized;

    try {
      return {
        buffer: Buffer.from(content, 'base64'),
      };
    } catch {
      throw new BadRequestException('Uno de los adjuntos no es valido.');
    }
  }

  private toCuentaAuditSnapshot(
    cuenta: Awaited<ReturnType<CuentasDineroService['findOne']>>,
  ): CuentaAuditSnapshot {
    return {
      id: cuenta.id,
      nombre: cuenta.nombre,
      descripcion: cuenta.descripcion,
      monto_actual: cuenta.monto_actual.toString(),
      area: cuenta.Area,
      rama: cuenta.Rama,
      miembro: cuenta.Miembro,
    };
  }

  private toMovimientoAuditSnapshot(
    movimiento:
      | Awaited<ReturnType<CuentasDineroService['findMovimiento']>>
      | Awaited<ReturnType<CuentasDineroService['findMovimientoWithinClient']>>,
  ): MovimientoCuentaAuditSnapshot {
    if (!movimiento) {
      throw new NotFoundException('No se pudo construir la auditoria del movimiento.');
    }

    return {
      id: movimiento.id,
      cuenta: movimiento.CuentaDinero,
      responsable: movimiento.Responsable,
      metodoPago: movimiento.MetodoPago,
      monto: movimiento.monto.toString(),
      tipo: movimiento.tipo,
      detalles: movimiento.detalles,
      fecha_movimiento: movimiento.fecha_movimiento,
      saldo_anterior: movimiento.saldo_anterior.toString(),
      saldo_posterior: movimiento.saldo_posterior.toString(),
      codigo_referencia: movimiento.codigo_referencia,
      borrado: movimiento.borrado,
      createdAt: movimiento.createdAt,
      adjuntos: movimiento.Adjuntos.map((adjunto) => ({
        id: adjunto.id,
        nombre: adjunto.nombre,
        mime: adjunto.mime,
        borrado: false,
      })),
    };
  }

  private toMovimientoAdjuntoAuditSnapshot(adjunto: {
    id: number;
    nombre: string;
    mime: string;
    createdAt: Date;
    id_movimiento_cuenta: number;
  }): MovimientoCuentaAdjuntoAuditSnapshot {
    return {
      id: adjunto.id,
      nombre: adjunto.nombre,
      mime: adjunto.mime,
      movimientoId: adjunto.id_movimiento_cuenta,
      createdAt: adjunto.createdAt,
    };
  }
}
