import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { Prisma, SCOPE } from '@prisma/client';
import PDFDocument = require('pdfkit');
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasUnrestrictedAccess } from '../auth/utils/unrestricted-access.util';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PagosQueryDto } from './dto/pagos-query.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';

type VisibleCuenta = {
  id: number;
  nombre: string;
  monto_actual: Prisma.Decimal;
};

const ADULT_SCOPED_ROLES = new Set([
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
]);

@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeFilterService: ScopeFilterService,
  ) {}

  private readonly createOrUpdatePagoInput!: {
    monto: number;
    detalles?: string;
    fechaPago?: Date;
    idCuentaDinero: number;
    idMetodoPago: number;
    idConceptoPago: number;
    idMiembro: number;
    idCuentaOrigen?: number | null;
    idEvento?: number;
    comprobantePagoBase64?: string | null;
    comprobantePagoMimeType?: string | null;
    comprobantePagoNombre?: string | null;
  };

  async findAll(user: AuthenticatedUser, paginationQuery: PagosQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;
    const searchTerm = paginationQuery.q?.trim();

    const where = this.scopeFilterService.mergeWhere(
      {
        borrado: false,
        ...(paginationQuery.idConceptoPago
          ? { id_concepto_pago: paginationQuery.idConceptoPago }
          : {}),
        ...(paginationQuery.idMetodoPago
          ? { id_metodo_pago: paginationQuery.idMetodoPago }
          : {}),
        ...(paginationQuery.idCuentaDinero
          ? { id_cuenta_dinero: paginationQuery.idCuentaDinero }
          : {}),
        ...(paginationQuery.idCuentaOrigen
          ? { id_cuenta_origen: paginationQuery.idCuentaOrigen }
          : {}),
        ...(searchTerm
          ? {
              OR: [
                {
                  codigo_validacion: {
                    contains: searchTerm,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  detalles: {
                    contains: searchTerm,
                    mode: Prisma.QueryMode.insensitive,
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
                {
                  ConceptoPago: {
                    nombre: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
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
                {
                  CuentaDinero: {
                    nombre: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
                {
                  CuentaOrigen: {
                    nombre: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              ],
            }
          : {}),
      },
      this.scopeFilterService.forPagos(user),
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.pago.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fecha_pago: 'desc' }, { id: 'desc' }],
        select: this.pagoSelect(),
      }),
      this.prisma.pago.count({ where }),
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
    const [cuentas, conceptos, metodos, miembros] =
      await this.prisma.$transaction([
        this.prisma.cuentaDinero.findMany({
          where: this.scopeFilterService.mergeWhere(
            { borrado: false },
            this.scopeFilterService.forCuentasDinero(user),
          ),
          orderBy: { nombre: 'asc' },
          select: {
            id: true,
            nombre: true,
            monto_actual: true,
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
              },
            },
            Miembro: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
              },
            },
          },
        }),
        this.prisma.conceptoPago.findMany({
          where: { borrado: false },
          orderBy: { nombre: 'asc' },
          select: {
            id: true,
            nombre: true,
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
      cuentas,
      conceptos,
      metodos,
      miembros,
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const pago = await this.findOneWithinClient(this.prisma, id, user);

    if (!pago) {
      throw new NotFoundException('El pago indicado no existe.');
    }

    return pago;
  }

  async exportReceiptPdf(id: number, user: AuthenticatedUser) {
    const pago = await this.findOne(id, user);
    const firmaResponsable = pago.Responsable
      ? await this.getResponsableFirma(pago.Responsable.id)
      : null;
    const responsableStamp = pago.Responsable
      ? await this.getResponsableStamp(pago.Responsable.id)
      : null;
    const buffer = await this.buildReceiptPdfBuffer(
      pago,
      firmaResponsable,
      responsableStamp,
    );

    return {
      filename: `comprobante-pago-${String(pago.id).padStart(6, '0')}.pdf`,
      buffer,
    };
  }

  async create(dto: CreatePagoDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const data = await this.resolvePagoData(tx, dto, user);

      await this.ensureCanRevertDestination(tx, data.idCuentaDinero, 0);
      await this.applyPagoImpact(
        tx,
        {
          monto: data.monto,
          idCuentaDinero: data.idCuentaDinero,
          idCuentaOrigen: data.idCuentaOrigen,
        },
        'apply',
      );

      const created = await tx.pago.create({
        data: {
          monto: data.monto,
          detalles: data.detalles,
          comprobante_pago: data.comprobantePago,
          comprobante_pago_mime: data.comprobantePagoMimeType,
          comprobante_pago_nombre: data.comprobantePagoNombre,
          fecha_pago: data.fechaPago,
          id_cuenta_dinero: data.idCuentaDinero,
          id_cuenta_origen: data.idCuentaOrigen,
          id_metodo_pago: data.idMetodoPago,
          id_concepto_pago: data.idConceptoPago,
          id_miembro: data.idMiembro,
          id_responsable: data.idResponsable,
          id_evento: data.idEvento,
        },
        select: {
          id: true,
        },
      });

      return this.findOneWithinClient(tx, created.id, user);
    });
  }

  async update(id: number, dto: UpdatePagoDto, user: AuthenticatedUser) {
    const existing = await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const resolved = await this.resolvePagoData(
        tx,
        {
          monto: dto.monto ?? Number(existing.monto),
          detalles: dto.detalles ?? existing.detalles ?? undefined,
          fechaPago: dto.fechaPago ?? new Date(existing.fecha_pago),
          idCuentaDinero: dto.idCuentaDinero ?? existing.CuentaDinero.id,
          idCuentaOrigen:
            dto.idCuentaOrigen !== undefined
              ? dto.idCuentaOrigen
              : (existing.CuentaOrigen?.id ?? undefined),
          idMetodoPago: dto.idMetodoPago ?? existing.MetodoPago.id,
          idConceptoPago: dto.idConceptoPago ?? existing.ConceptoPago.id,
          idMiembro: dto.idMiembro ?? existing.Miembro.id,
          idEvento:
            dto.idEvento !== undefined
              ? dto.idEvento
              : (existing.Evento?.id ?? undefined),
          comprobantePagoBase64:
            dto.comprobantePagoBase64 !== undefined
              ? dto.comprobantePagoBase64
              : undefined,
          comprobantePagoMimeType:
            dto.comprobantePagoMimeType !== undefined
              ? dto.comprobantePagoMimeType
              : undefined,
          comprobantePagoNombre:
            dto.comprobantePagoNombre !== undefined
              ? dto.comprobantePagoNombre
              : undefined,
        },
        user,
      );

      await this.applyPagoImpact(
        tx,
        {
          monto: new Prisma.Decimal(existing.monto),
          idCuentaDinero: existing.CuentaDinero.id,
          idCuentaOrigen: existing.CuentaOrigen?.id ?? null,
        },
        'revert',
      );

      await this.applyPagoImpact(
        tx,
        {
          monto: resolved.monto,
          idCuentaDinero: resolved.idCuentaDinero,
          idCuentaOrigen: resolved.idCuentaOrigen,
        },
        'apply',
      );

      await tx.pago.update({
        where: { id },
        data: {
          monto: resolved.monto,
          detalles: resolved.detalles,
          comprobante_pago: resolved.comprobantePago,
          comprobante_pago_mime: resolved.comprobantePagoMimeType,
          comprobante_pago_nombre: resolved.comprobantePagoNombre,
          fecha_pago: resolved.fechaPago,
          id_cuenta_dinero: resolved.idCuentaDinero,
          id_cuenta_origen: resolved.idCuentaOrigen,
          id_metodo_pago: resolved.idMetodoPago,
          id_concepto_pago: resolved.idConceptoPago,
          id_miembro: resolved.idMiembro,
          id_responsable: resolved.idResponsable,
          id_evento: resolved.idEvento,
        },
      });

      return this.findOneWithinClient(tx, id, user);
    });
  }

  async remove(id: number, user: AuthenticatedUser) {
    const existing = await this.findOne(id, user);

    await this.prisma.$transaction(async (tx) => {
      await this.applyPagoImpact(
        tx,
        {
          monto: new Prisma.Decimal(existing.monto),
          idCuentaDinero: existing.CuentaDinero.id,
          idCuentaOrigen: existing.CuentaOrigen?.id ?? null,
        },
        'revert',
      );

      await tx.pago.update({
        where: { id },
        data: {
          borrado: true,
        },
      });
    });
  }

  private pagoSelect() {
    return {
      id: true,
      monto: true,
      detalles: true,
      comprobante_pago_mime: true,
      comprobante_pago_nombre: true,
      fecha_pago: true,
      createdAt: true,
      codigo_validacion: true,
      Miembro: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
        },
      },
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
      ConceptoPago: {
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
      CuentaOrigen: {
        select: {
          id: true,
          nombre: true,
        },
      },
      Evento: {
        select: {
          id: true,
          nombre: true,
        },
      },
    } satisfies Prisma.PagoSelect;
  }

  async getAttachedReceipt(id: number, user: AuthenticatedUser) {
    const pago = await this.prisma.pago.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
        },
        this.scopeFilterService.forPagos(user),
      ),
      select: {
        comprobante_pago: true,
        comprobante_pago_mime: true,
        comprobante_pago_nombre: true,
      },
    });

    if (!pago) {
      throw new NotFoundException('El pago indicado no existe.');
    }

    if (!pago.comprobante_pago || !pago.comprobante_pago_mime) {
      throw new NotFoundException('El pago no tiene comprobante adjunto.');
    }

    return {
      buffer: Buffer.from(pago.comprobante_pago),
      mimeType: pago.comprobante_pago_mime,
      filename: pago.comprobante_pago_nombre ?? 'comprobante-pago-adjunto',
    };
  }

  async getWhatsappShareData(id: number, user: AuthenticatedUser) {
    const pago = await this.prisma.pago.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
        },
        this.scopeFilterService.forPagos(user),
      ),
      select: {
        id: true,
        monto: true,
        fecha_pago: true,
        codigo_validacion: true,
        ConceptoPago: {
          select: {
            nombre: true,
          },
        },
        Miembro: {
          select: {
            nombre: true,
            apellidos: true,
            Protagonista: {
              select: {
                Responsabilidad: {
                  where: {
                    borrado: false,
                    Responsable: {
                      borrado: false,
                      Miembro: {
                        borrado: false,
                        telefono: {
                          not: null,
                        },
                      },
                    },
                  },
                  orderBy: {
                    id: 'asc',
                  },
                  take: 1,
                  select: {
                    Responsable: {
                      select: {
                        Miembro: {
                          select: {
                            nombre: true,
                            apellidos: true,
                            telefono: true,
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

    if (!pago) {
      throw new NotFoundException('El pago indicado no existe.');
    }

    const firstResponsable =
      pago.Miembro.Protagonista?.Responsabilidad[0]?.Responsable.Miembro;

    if (!firstResponsable?.telefono) {
      throw new NotFoundException(
        'El pago no tiene un responsable con teléfono disponible para WhatsApp.',
      );
    }

    const phone = this.normalizeWhatsappPhone(firstResponsable.telefono);

    if (!phone) {
      throw new BadRequestException(
        'El teléfono del responsable no es válido para WhatsApp.',
      );
    }

    return {
      phone,
      responsableNombre: `${firstResponsable.nombre} ${firstResponsable.apellidos}`.trim(),
      message: [
        `Hola ${firstResponsable.nombre},`,
        `te compartimos el comprobante del pago ${pago.codigo_validacion}.`,
        `Concepto: ${pago.ConceptoPago.nombre}.`,
        `Importe: $${pago.monto.toString()}.`,
        `Fecha: ${this.formatDate(pago.fecha_pago)}.`,
        `Corresponde a ${pago.Miembro.nombre} ${pago.Miembro.apellidos}.`,
      ].join('\n'),
    };
  }

  private async findOneWithinClient(
    client: PrismaService | Prisma.TransactionClient,
    id: number,
    user: AuthenticatedUser,
  ) {
    return client.pago.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
        },
        this.scopeFilterService.forPagos(user),
      ),
      select: this.pagoSelect(),
    });
  }

  private async resolvePagoData(
    tx: Prisma.TransactionClient,
    dto: typeof this.createOrUpdatePagoInput,
    user: AuthenticatedUser,
  ) {
    const monto = new Prisma.Decimal(dto.monto);

    if (monto.lte(0)) {
      throw new BadRequestException('El monto debe ser mayor a cero.');
    }

    const cuentaDestino = await this.findAccessibleCuentaOrThrow(
      tx,
      dto.idCuentaDinero,
      user,
    );

    let cuentaOrigen: VisibleCuenta | null = null;

    if (dto.idCuentaOrigen != null) {
      if (dto.idCuentaOrigen === dto.idCuentaDinero) {
        throw new BadRequestException(
          'La cuenta de origen y destino no pueden ser la misma.',
        );
      }

      cuentaOrigen = await this.findAccessibleCuentaOrThrow(
        tx,
        dto.idCuentaOrigen,
        user,
      );
    }

    await this.ensureVisibleMiembro(tx, dto.idMiembro, user);
    const responsableId = await this.resolveAuthenticatedResponsable(tx, user);

    const metodo = await tx.metodoPago.findFirst({
      where: {
        id: dto.idMetodoPago,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!metodo) {
      throw new NotFoundException('El método de pago indicado no existe.');
    }

    const concepto = await tx.conceptoPago.findFirst({
      where: {
        id: dto.idConceptoPago,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!concepto) {
      throw new NotFoundException('El concepto de pago indicado no existe.');
    }

    if (dto.idEvento) {
      const evento = await tx.evento.findFirst({
        where: {
          id: dto.idEvento,
          borrado: false,
        },
        select: {
          id: true,
        },
      });

      if (!evento) {
        throw new NotFoundException('El evento indicado no existe.');
      }
    }

    return {
      monto,
      detalles: dto.detalles?.trim() || null,
      fechaPago: dto.fechaPago ?? new Date(),
      idCuentaDinero: cuentaDestino.id,
      idCuentaOrigen: cuentaOrigen?.id ?? null,
      idMetodoPago: dto.idMetodoPago,
      idConceptoPago: dto.idConceptoPago,
      idMiembro: dto.idMiembro,
      idResponsable: responsableId,
      idEvento: dto.idEvento ?? null,
      ...this.parseAttachedReceipt(
        dto.comprobantePagoBase64,
        dto.comprobantePagoMimeType,
        dto.comprobantePagoNombre,
      ),
    };
  }

  private async findAccessibleCuentaOrThrow(
    tx: Prisma.TransactionClient,
    id: number,
    user: AuthenticatedUser,
  ): Promise<VisibleCuenta> {
    const cuenta = await tx.cuentaDinero.findFirst({
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
        monto_actual: true,
      },
    });

    if (!cuenta) {
      throw new ForbiddenException(
        'No tienes acceso a la cuenta de dinero indicada.',
      );
    }

    return cuenta;
  }

  private async ensureVisibleMiembro(
    tx: Prisma.TransactionClient,
    idMiembro: number,
    user: AuthenticatedUser,
  ) {
    const miembro = await tx.miembro.findFirst({
      where: {
        AND: [
          { id: idMiembro, borrado: false },
          this.buildVisibleMiembroWhere(user),
        ],
      },
      select: {
        id: true,
      },
    });

    if (!miembro) {
      throw new ForbiddenException(
        'No tienes acceso al miembro indicado para registrar este pago.',
      );
    }
  }

  private async resolveAuthenticatedResponsable(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUser,
  ) {
    const responsable = await tx.miembro.findFirst({
      where: {
        id_cuenta: user.userId,
        borrado: false,
        Adulto: {
          is: {
            borrado: false,
            activo: true,
          },
        },
      },
      select: {
        id: true,
        firma: true,
      },
    });

    if (!responsable) {
      throw new ForbiddenException(
        'Solo un adulto autenticado puede registrar pagos.',
      );
    }

    if (!responsable.firma || responsable.firma.length === 0) {
      throw new BadRequestException(
        'No se puede registrar el pago porque el adulto responsable no tiene firma cargada.',
      );
    }

    return responsable.id;
  }

  private async applyPagoImpact(
    tx: Prisma.TransactionClient,
    input: {
      monto: Prisma.Decimal;
      idCuentaDinero: number;
      idCuentaOrigen: number | null;
    },
    mode: 'apply' | 'revert',
  ) {
    if (mode === 'revert') {
      await this.ensureCanRevertDestination(
        tx,
        input.idCuentaDinero,
        input.monto,
      );
    }

    if (mode === 'apply' && input.idCuentaOrigen) {
      await this.ensureCanDebitOrigin(tx, input.idCuentaOrigen, input.monto);
    }

    if (mode === 'revert') {
      await tx.cuentaDinero.update({
        where: { id: input.idCuentaDinero },
        data: {
          monto_actual: {
            decrement: input.monto,
          },
        },
      });

      if (input.idCuentaOrigen) {
        await tx.cuentaDinero.update({
          where: { id: input.idCuentaOrigen },
          data: {
            monto_actual: {
              increment: input.monto,
            },
          },
        });
      }

      return;
    }

    await tx.cuentaDinero.update({
      where: { id: input.idCuentaDinero },
      data: {
        monto_actual: {
          increment: input.monto,
        },
      },
    });

    if (input.idCuentaOrigen) {
      await tx.cuentaDinero.update({
        where: { id: input.idCuentaOrigen },
        data: {
          monto_actual: {
            decrement: input.monto,
          },
        },
      });
    }
  }

  private async ensureCanDebitOrigin(
    tx: Prisma.TransactionClient,
    idCuenta: number,
    monto: Prisma.Decimal,
  ) {
    const cuenta = await tx.cuentaDinero.findFirst({
      where: {
        id: idCuenta,
        borrado: false,
      },
      select: {
        id: true,
        monto_actual: true,
      },
    });

    if (!cuenta) {
      throw new NotFoundException('La cuenta de origen indicada no existe.');
    }

    if (cuenta.monto_actual.lt(monto)) {
      throw new ConflictException(
        'La cuenta de origen no tiene saldo suficiente para esta operación.',
      );
    }
  }

  private async ensureCanRevertDestination(
    tx: Prisma.TransactionClient,
    idCuenta: number,
    monto: Prisma.Decimal | number,
  ) {
    const amount =
      typeof monto === 'number' ? new Prisma.Decimal(monto) : monto;
    const cuenta = await tx.cuentaDinero.findFirst({
      where: {
        id: idCuenta,
        borrado: false,
      },
      select: {
        id: true,
        monto_actual: true,
      },
    });

    if (!cuenta) {
      throw new NotFoundException('La cuenta de destino indicada no existe.');
    }

    if (cuenta.monto_actual.lt(amount)) {
      throw new ConflictException(
        'La cuenta de destino no tiene saldo suficiente para revertir esta operación.',
      );
    }
  }

  private buildVisibleMiembroWhere(
    user: AuthenticatedUser,
  ): Prisma.MiembroWhereInput {
    if (this.hasFullAccess(user)) {
      return {
        borrado: false,
      };
    }

    const filters: Prisma.MiembroWhereInput[] = [];

    for (const scope of user.scopes) {
      if (scope.scopeId == null || !ADULT_SCOPED_ROLES.has(scope.role)) {
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

    if (user.roles.includes('PROTAGONISTA')) {
      filters.push({
        id_cuenta: user.userId,
        Protagonista: {
          is: {
            borrado: false,
            activo: true,
          },
        },
      });
    }

    if (user.roles.includes('RESPONSABLE')) {
      filters.push({
        OR: [
          {
            id_cuenta: user.userId,
            Responsable: {
              is: {
                borrado: false,
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
                    Responsable: {
                      Miembro: {
                        id_cuenta: user.userId,
                        borrado: false,
                      },
                      borrado: false,
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

  private hasFullAccess(user: AuthenticatedUser): boolean {
    return hasUnrestrictedAccess(user);
  }

  private async buildReceiptPdfBuffer(
    pago: Awaited<ReturnType<PagosService['findOne']>>,
    firmaResponsable: Buffer | null,
    responsableStamp: {
      nombreCompleto: string;
      dni: string;
      rama: string | null;
      area: string | null;
      posicion: string | null;
    } | null,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: [595.28, 420.94],
        margin: 24,
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const left = doc.page.margins.left;
      const top = doc.page.margins.top;
      const width =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const height =
        doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
      const logoPath = this.resolveScoutLogoPath();

      doc
        .lineWidth(1)
        .strokeColor('#111827')
        .rect(left, top, width, height)
        .stroke();

      if (logoPath) {
        doc.image(logoPath, left + 18, top + 18, { fit: [44, 44] });
      }

      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('Grupo Scout Adalberto Lopez', left + 72, top + 24);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#6b7280')
        .text('Siempre Listos', left + 72, top + 44);

      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('COMPROBANTE DE PAGO', left + width - 220, top + 18, {
          width: 200,
          align: 'right',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(11.5)
        .text(
          `N° ${String(pago.id).padStart(6, '0')}`,
          left + width - 200,
          top + 42,
          {
            width: 180,
            align: 'right',
          },
        );

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
          `Fecha: ${this.formatDate(new Date(pago.fecha_pago))}`,
          left + width - 200,
          top + 62,
          {
            width: 180,
            align: 'right',
          },
        );

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#9ca3af')
        .text(
          `Hash: ${pago.codigo_validacion.slice(0, 8).toUpperCase()}-${pago.codigo_validacion.slice(-4).toUpperCase()}`,
          left + width - 200,
          top + 82,
          {
            width: 180,
            align: 'right',
          },
        );

      doc
        .moveTo(left + 18, top + 112)
        .lineTo(left + width - 18, top + 112)
        .strokeColor('#d1d5db')
        .lineWidth(1)
        .stroke();

      const labelX = left + 18;
      const valueX = left + 150;
      let cursorY = top + 138;

      const rows = [
        {
          label: 'Recibi de:',
          value: `${pago.Miembro.nombre} ${pago.Miembro.apellidos} (DNI: ${pago.Miembro.dni})`,
        },
        {
          label: 'La suma de:',
          value: this.formatCurrency(pago.monto),
        },
        {
          label: 'En concepto de:',
          value: pago.ConceptoPago.nombre,
        },
        {
          label: 'Medio de Pago:',
          value: pago.MetodoPago.nombre,
        },
      ];

      rows.forEach((row) => {
        doc
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(row.label, labelX, cursorY);

        doc
          .font('Helvetica')
          .fontSize(10)
          .text(row.value, valueX, cursorY, {
            width: width - (valueX - left) - 18,
          });

        cursorY += 26;
      });

      doc
        .fillColor('#6b7280')
        .font('Helvetica')
        .fontSize(8.5)
        .text(
          'Comprobante válido como constancia de pago interna.',
          labelX,
          top + 304,
        );

      doc.text(`Generado el ${this.formatDate(new Date())}`, labelX, top + 322);

      const signatureY = top + 318;
      const signatureX = left + width - 190;
      doc
        .moveTo(signatureX, signatureY)
        .lineTo(signatureX + 140, signatureY)
        .strokeColor('#111827')
        .lineWidth(1)
        .stroke();

      if (firmaResponsable) {
        doc.image(firmaResponsable, signatureX + 8, signatureY - 48, {
          fit: [124, 40],
          align: 'center',
          valign: 'center',
        });
      }

      if (responsableStamp) {
        const stampTop = signatureY + 6;

        doc
          .roundedRect(signatureX - 4, stampTop, 148, 42, 8)
          .fillOpacity(0.08)
          .fillAndStroke('#e5e7eb', '#9ca3af');

        doc.fillOpacity(1);

        doc
          .fillColor('#4b5563')
          .font('Helvetica')
          .fontSize(8)
          .text(
            `${responsableStamp.nombreCompleto} • DNI ${responsableStamp.dni}`,
            signatureX - 8,
            stampTop + 10,
            {
              width: 156,
              align: 'center',
            },
          );

        doc.text(
          `${responsableStamp.rama ?? responsableStamp.area ?? 'Sin asignacion'}${responsableStamp.posicion ? ` • ${responsableStamp.posicion}` : ''}`,
          signatureX - 8,
          stampTop + 24,
          {
            width: 156,
            align: 'center',
          },
        );
      }

      doc.end();
    });
  }

  private resolveScoutLogoPath() {
    const candidates = [
      path.resolve(process.cwd(), 'public/scout_logo.png'),
      path.resolve(process.cwd(), '../front-sas/public/scout_logo.png'),
      path.resolve(process.cwd(), '../public/scout_logo.png'),
    ];

    return candidates.find((candidate) => existsSync(candidate));
  }

  private async getResponsableFirma(idMiembro: number) {
    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id: idMiembro,
        borrado: false,
      },
      select: {
        firma: true,
      },
    });

    return miembro?.firma ? Buffer.from(miembro.firma) : null;
  }

  private async getResponsableStamp(idMiembro: number) {
    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id: idMiembro,
        borrado: false,
      },
      select: {
        nombre: true,
        apellidos: true,
        dni: true,
        Adulto: {
          select: {
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
                Rama: {
                  select: {
                    nombre: true,
                  },
                },
                Area: {
                  select: {
                    nombre: true,
                  },
                },
                Posicion: {
                  select: {
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
      return null;
    }

    const asignacionActual = miembro.Adulto?.EquipoArea[0] ?? null;

    return {
      nombreCompleto: `${miembro.apellidos}, ${miembro.nombre}`,
      dni: miembro.dni,
      rama: asignacionActual?.Rama?.nombre ?? null,
      area: asignacionActual?.Area.nombre ?? null,
      posicion: asignacionActual?.Posicion.nombre ?? null,
    };
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  }

  private formatCurrency(value: string | number | Prisma.Decimal) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  private parseAttachedReceipt(
    base64: string | null | undefined,
    mimeType: string | null | undefined,
    fileName: string | null | undefined,
  ) {
    if (base64 === undefined) {
      return {
        comprobantePago: undefined,
        comprobantePagoMimeType: undefined,
        comprobantePagoNombre: undefined,
      };
    }

    if (base64 === null) {
      return {
        comprobantePago: null,
        comprobantePagoMimeType: null,
        comprobantePagoNombre: null,
      };
    }

    if (!mimeType) {
      throw new BadRequestException(
        'El comprobante adjunto requiere indicar su tipo de archivo.',
      );
    }

    const normalizedMime = mimeType.trim().toLowerCase();
    const allowedMimeTypes = new Set([
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ]);

    if (!allowedMimeTypes.has(normalizedMime)) {
      throw new BadRequestException(
        'El comprobante adjunto debe ser un PDF o una imagen válida.',
      );
    }

    const match = base64.match(/^data:[^;]+;base64,(.+)$/);
    const normalizedBase64 = match ? match[1] : base64;
    const buffer = Buffer.from(normalizedBase64, 'base64');

    if (buffer.length === 0) {
      throw new BadRequestException('El comprobante adjunto no es válido.');
    }

    return {
      comprobantePago: buffer,
      comprobantePagoMimeType: normalizedMime,
      comprobantePagoNombre: fileName?.trim() || 'comprobante-adjunto',
    };
  }

  private normalizeWhatsappPhone(phone: string) {
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 8) {
      return null;
    }

    if (digits.startsWith('549')) {
      return digits;
    }

    if (digits.startsWith('54')) {
      return `549${digits.slice(2)}`;
    }

    if (digits.startsWith('0')) {
      return `549${digits.slice(1)}`;
    }

    return `549${digits}`;
  }
}
