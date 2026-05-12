import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SCOPE,
  TIPO_EVENTO_VENTA_HOJA,
  TIPO_EVENTO_VENTA_PAGO,
  TIPO_EVENTO_VENTA_SECTOR,
} from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoVentaDto } from './dto/create-evento-venta.dto';
import {
  CreateEventoVentaItemDto,
  CreateEventoVentaItemOfertaDto,
} from './dto/create-evento-venta-item.dto';
import { CreateEventoVentaReservaDto } from './dto/create-evento-venta-reserva.dto';
import { EventoVentaCostoItemDto } from './dto/evento-venta-costo-item.dto';
import { EventosVentaQueryDto } from './dto/eventos-venta-query.dto';
import { UpdateEventoVentaDto } from './dto/update-evento-venta.dto';
import { UpdateEventoVentaItemDto } from './dto/update-evento-venta-item.dto';
import { UpdateEventoVentaReservaDto } from './dto/update-evento-venta-reserva.dto';

type SheetRow = Array<string | number | boolean | Date | null>;

interface UploadedSpreadsheetFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

interface SectorSheetResolution {
  displayName: string;
  type: TIPO_EVENTO_VENTA_SECTOR;
  ramaId: number | null;
  areaId: number | null;
}

const ENCARGADO_JUVENIL_EVENTOS_VENTA_ROLE =
  'ENCARGADO_JUVENIL_EVENTOS_VENTA';

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const normalizeKey = (value: string) =>
  normalizeText(value).replace(/[^A-Z0-9]+/g, '');

const slugifyFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const toSheetName = (value: string, fallback: string) => {
  const sanitized = value.replace(/[:\\/?*\[\]]/g, ' ').trim();
  return (sanitized || fallback).slice(0, 31);
};

const normalizeAccount = (value: string) => value.trim().toUpperCase();

const toOptionalString = (value: unknown) => {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text ? text : null;
};

const toOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  const text = String(value).trim();
  if (!text || text === '#VALUE!') {
    return null;
  }

  const normalized = text
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]+/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDecimal = (value: number | null | undefined) =>
  new Prisma.Decimal(value ?? 0);

const toNullableDecimal = (value: number | null | undefined) =>
  value === null || value === undefined ? null : new Prisma.Decimal(value);

const sumNumbers = (values: Array<number | null | undefined>) =>
  values.reduce<number>((acc, value) => acc + (value ?? 0), 0);

const toJsonValue = (value: unknown): Prisma.InputJsonValue => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item));
  }

  return String(value);
};

@Injectable()
export class EventosVentaService {
  constructor(private readonly prisma: PrismaService) {}

  async listEncargadosJuveniles() {
    const assigned = await this.prisma.cuentaRole.findMany({
      where: {
        Role: {
          nombre: ENCARGADO_JUVENIL_EVENTOS_VENTA_ROLE,
        },
        Cuenta: {
          borrado: false,
          Miembro: {
            is: this.buildEncargadoJuvenilEligibleWhere(),
          },
        },
      },
      select: {
        id_cuenta: true,
        Cuenta: {
          select: {
            Miembro: {
              select: this.encargadoJuvenilMemberSelect(),
            },
          },
        },
      },
      orderBy: [
        {
          Cuenta: {
            Miembro: {
              apellidos: 'asc',
            },
          },
        },
        {
          Cuenta: {
            Miembro: {
              nombre: 'asc',
            },
          },
        },
      ],
    });

    const seenMemberIds = new Set<number>();

    return assigned
      .map((item) => {
        const miembro = item.Cuenta.Miembro;

        if (!miembro || seenMemberIds.has(miembro.id)) {
          return null;
        }

        seenMemberIds.add(miembro.id);

        return this.mapEncargadoJuvenilMember(miembro, true);
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  async getEncargadosJuvenilesOptions(query?: string) {
    const search = query?.trim();
    const miembros = await this.prisma.miembro.findMany({
      where: {
        ...this.buildEncargadoJuvenilEligibleWhere(),
        ...(search
          ? {
              OR: [
                {
                  nombre: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  apellidos: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  dni: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            }
          : {}),
      },
      select: this.encargadoJuvenilMemberSelect(),
      orderBy: [{ apellidos: 'asc' }, { nombre: 'asc' }],
    });

    const assignedCuentaRoles = await this.prisma.cuentaRole.findMany({
      where: {
        Role: {
          nombre: ENCARGADO_JUVENIL_EVENTOS_VENTA_ROLE,
        },
        id_cuenta: {
          in: miembros.map((miembro) => miembro.id_cuenta),
        },
      },
      select: {
        id_cuenta: true,
      },
    });

    const assignedCuentaIds = new Set(
      assignedCuentaRoles.map((item) => item.id_cuenta),
    );

    return miembros.map((miembro) =>
      this.mapEncargadoJuvenilMember(
        miembro,
        assignedCuentaIds.has(miembro.id_cuenta),
      ),
    );
  }

  async assignEncargadoJuvenil(memberId: number) {
    const role = await this.ensureEncargadoJuvenilRole();
    const miembro = await this.ensureEncargadoJuvenilEligibleMember(memberId);

    await this.prisma.$transaction(async (tx) => {
      await tx.cuentaRole.deleteMany({
        where: {
          id_cuenta: miembro.id_cuenta,
          id_role: role.id,
        },
      });

      await tx.cuentaRole.create({
        data: {
          id_cuenta: miembro.id_cuenta,
          id_role: role.id,
          tipo_scope: SCOPE.GRUPO,
          id_scope: null,
        },
      });
    });

    return this.mapEncargadoJuvenilMember(miembro, true);
  }

  async removeEncargadoJuvenil(memberId: number) {
    const role = await this.ensureEncargadoJuvenilRole();

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id: memberId,
        borrado: false,
      },
      select: {
        id: true,
        id_cuenta: true,
      },
    });

    if (!miembro) {
      throw new NotFoundException('El miembro indicado no existe.');
    }

    await this.prisma.cuentaRole.deleteMany({
      where: {
        id_cuenta: miembro.id_cuenta,
        id_role: role.id,
      },
    });
  }

  async findAll(query: EventosVentaQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const trimmedQuery = query.q?.trim();

    const where: Prisma.EventoVentaWhereInput = {
      ...(query.includeDeleted ? {} : { borrado: false }),
      ...(trimmedQuery
        ? {
            OR: [
              { nombre: { contains: trimmedQuery, mode: 'insensitive' } },
              { descripcion: { contains: trimmedQuery, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.eventoVenta.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fecha_evento: 'desc' }, { nombre: 'asc' }],
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          fecha_evento: true,
          borrado: true,
          Items: {
            where: { borrado: false },
            select: { id: true },
          },
          Sectores: {
            where: { borrado: false },
            select: { id: true },
          },
          Reservas: {
            where: { borrado: false },
            select: {
              cantidad_total: true,
              cantidad_retirada: true,
              monto_total: true,
              monto_pagado: true,
              saldo_pendiente: true,
            },
          },
        },
      }),
      this.prisma.eventoVenta.count({ where }),
    ]);

    return {
      data: data.map((item: {
        id: number;
        nombre: string;
        descripcion: string | null;
        fecha_evento: Date;
        borrado: boolean;
        Items: Array<{ id: number }>;
        Sectores: Array<{ id: number }>;
        Reservas: Array<{
          cantidad_total: number;
          cantidad_retirada: number;
          monto_total: Prisma.Decimal;
          monto_pagado: Prisma.Decimal;
          saldo_pendiente: Prisma.Decimal;
        }>;
      }) => ({
        ...item,
        resumen: {
          cantidadVendida: item.Reservas.reduce(
            (acc: number, reserva) => acc + reserva.cantidad_total,
            0,
          ),
          cantidadRetirada: item.Reservas.reduce(
            (acc: number, reserva) => acc + reserva.cantidad_retirada,
            0,
          ),
          montoTotal: item.Reservas.reduce(
            (acc: number, reserva) => acc + Number(reserva.monto_total),
            0,
          ),
          montoPagado: item.Reservas.reduce(
            (acc: number, reserva) => acc + Number(reserva.monto_pagado),
            0,
          ),
          montoPendiente: item.Reservas.reduce(
            (acc: number, reserva) => acc + Number(reserva.saldo_pendiente),
            0,
          ),
        },
        _count: {
          Items: item.Items.length,
          Sectores: item.Sectores.length,
          Reservas: item.Reservas.length,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const evento = await this.prisma.eventoVenta.findFirst({
      where: { id, borrado: false },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        fecha_evento: true,
        notas: true,
        Items: {
          where: { borrado: false },
          orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            precio_unitario: true,
            activo: true,
            orden: true,
            Ofertas: {
              orderBy: [{ cantidad: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                cantidad: true,
                precio_total: true,
                descripcion: true,
              },
            },
          },
        },
        Costos: {
          where: { borrado: false },
          orderBy: [{ orden: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            unidad_medida: true,
            costo_unitario_x10000: true,
            cantidad_x10000: true,
            orden: true,
          },
        },
        Sectores: {
          where: { borrado: false },
          orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
          select: {
            id: true,
            nombre: true,
            tipo_sector: true,
            nombre_hoja: true,
            id_rama: true,
            id_area: true,
            resumen_total_vendido: true,
            resumen_total_retirado: true,
            monto_rendido_efectivo: true,
            monto_rendido_transferencia: true,
            monto_deuda_informado: true,
            Rama: {
              select: {
                id: true,
                nombre: true,
              },
            },
            Area: {
              select: {
                id: true,
                nombre: true,
              },
            },
            Reservas: {
              where: { borrado: false },
              select: {
                id: true,
              },
            },
          },
        },
        Reservas: {
          where: { borrado: false },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            comprador_nombre: true,
            vendedor_nombre: true,
            cantidad_total: true,
            cantidad_retirada: true,
            monto_total: true,
            monto_pagado: true,
            saldo_pendiente: true,
            cuenta_destino: true,
            observaciones: true,
            fila_origen: true,
            Vendedor: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
              },
            },
            Sector: {
              select: {
                id: true,
                nombre: true,
              },
            },
            Items: {
              select: {
                id: true,
                cantidad: true,
                precio_unitario: true,
                subtotal: true,
                Item: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
            Pagos: {
              where: { borrado: false },
              orderBy: [{ id: 'asc' }],
              select: {
                id: true,
                tipo_pago: true,
                monto: true,
                cuenta_destino: true,
                observaciones: true,
              },
            },
          },
        },
        HojasImportes: {
          where: { borrado: false },
          orderBy: [{ orden: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            nombre_hoja: true,
            nombre_visible: true,
            tipo_hoja: true,
            contenido: true,
          },
        },
      },
    });

    if (!evento) {
      throw new NotFoundException('El evento de venta indicado no existe.');
    }

    const resumen = {
      cantidadVendida: evento.Reservas.reduce(
        (acc: number, reserva) => acc + reserva.cantidad_total,
        0,
      ),
      cantidadRetirada: evento.Reservas.reduce(
        (acc: number, reserva) => acc + reserva.cantidad_retirada,
        0,
      ),
      montoTotal: evento.Reservas.reduce(
        (acc: number, reserva) => acc + Number(reserva.monto_total),
        0,
      ),
      montoPagado: evento.Reservas.reduce(
        (acc: number, reserva) => acc + Number(reserva.monto_pagado),
        0,
      ),
      montoPendiente: evento.Reservas.reduce(
        (acc: number, reserva) => acc + Number(reserva.saldo_pendiente),
        0,
      ),
    };

    const sellerMap = new Map<
      string,
      { nombre: string; cantidad: number; monto: number; reservas: number }
    >();

    for (const reserva of evento.Reservas) {
      const sellerName =
        reserva.Vendedor !== null
          ? `${reserva.Vendedor.nombre} ${reserva.Vendedor.apellidos}`.trim()
          : reserva.vendedor_nombre?.trim() || 'Sin vendedor';
      const current = sellerMap.get(sellerName) ?? {
        nombre: sellerName,
        cantidad: 0,
        monto: 0,
        reservas: 0,
      };

      current.cantidad += reserva.cantidad_total;
      current.monto += Number(reserva.monto_total);
      current.reservas += 1;
      sellerMap.set(sellerName, current);
    }

    const miembrosDisponibles = await this.prisma.miembro.findMany({
      where: {
        borrado: false,
        OR: [
          {
            Protagonista: {
              is: {
                borrado: false,
              },
            },
          },
          {
            Adulto: {
              is: {
                borrado: false,
              },
            },
          },
        ],
      },
      orderBy: [{ apellidos: 'asc' }, { nombre: 'asc' }],
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
          orderBy: [{ fecha_ingreso: 'desc' }, { id: 'desc' }],
          take: 1,
          select: {
            id_rama: true,
            Rama: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        Adulto: {
          select: {
            EquipoArea: {
              where: {
                borrado: false,
                activo: true,
                fecha_fin: null,
                id_rama: {
                  not: null,
                },
              },
              orderBy: [{ fecha_inicio: 'desc' }, { id: 'desc' }],
              take: 1,
              select: {
                id_rama: true,
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

    const miembrosDisponiblesNormalizados = miembrosDisponibles.map((miembro) => {
      const ramaProtagonista = miembro.MiembroRama[0]?.Rama ?? null;
      const ramaAdulto = miembro.Adulto?.EquipoArea[0]?.Rama ?? null;
      const ramaActual = ramaProtagonista ?? ramaAdulto;

      return {
        id: miembro.id,
        nombre: miembro.nombre,
        apellidos: miembro.apellidos,
        dni: miembro.dni,
        ramaActualId: ramaActual?.id ?? null,
        ramaActualNombre: ramaActual?.nombre ?? null,
      };
    });

    return {
      ...evento,
      miembrosDisponibles: miembrosDisponiblesNormalizados,
      resumen,
      rankingVendedores: Array.from(sellerMap.values()).sort(
        (a, b) => b.cantidad - a.cantidad || b.monto - a.monto,
      ),
    };
  }

  async exportSpreadsheet(id: number) {
    const evento = await this.findOne(id);
    const workbook = XLSX.utils.book_new();

    const reservasPorSector = new Map<number, typeof evento.Reservas>();

    for (const reserva of evento.Reservas) {
      const sectorId = reserva.Sector?.id;
      if (!sectorId) {
        continue;
      }

      const current = reservasPorSector.get(sectorId) ?? [];
      current.push(reserva);
      reservasPorSector.set(sectorId, current);
    }

    const balanceSummary = this.buildBalanceSummary(
      evento.Reservas,
      this.resolveCostoTotal(evento),
    );

    const balanceSheetRows: Array<Array<string | number>> = [
      ['BALANCE GENERAL'],
      [evento.nombre],
      [`Fecha: ${evento.fecha_evento.toISOString().slice(0, 10)}`],
      [],
      ['SECCIÓN', 'CONCEPTO', 'VALOR'],
      ['Porciones', 'Vendidas', balanceSummary.totalVendidas],
      ['Porciones', 'Retiradas', balanceSummary.totalRetiradas],
      ['Porciones', 'Por retirar', balanceSummary.totalPorRetirar],
      ['Ingresos', 'Total', balanceSummary.totalIngresos],
      ['Ingresos', 'Cobrado efectivo', balanceSummary.totalCobradoEfectivo],
      ['Ingresos', 'Cobrado transferencia', balanceSummary.totalCobradoTransferencia],
      ['Ingresos', 'Pendiente', balanceSummary.totalPendiente],
      ['Gastos y rendición', 'Gastos', balanceSummary.totalCostos],
      ['Gastos y rendición', 'Ya rendido', balanceSummary.totalRendido],
      ['Gastos y rendición', 'Falta rendir', balanceSummary.totalFaltaRendir],
      ['Resultado', 'Balance cobrado', balanceSummary.balanceCobrado],
      ['Resultado', 'Balance proyectado', balanceSummary.balanceProyectado],
    ];

    const balanceSheet = XLSX.utils.aoa_to_sheet(balanceSheetRows);
    this.decorateWorksheet(balanceSheet, {
      titleRows: [0, 1],
      headerRows: [4],
      sectionRows: [5, 8, 12, 15],
      widths: [20, 24, 18],
      moneyColumns: [2],
    });
    XLSX.utils.book_append_sheet(workbook, balanceSheet, 'BALANCE');

    const gastosSheetRows: Array<Array<string | number>> = [
      ['GASTOS'],
      [],
      [
        'NOMBRE',
        'DESCRIPCIÓN',
        'UNIDAD DE MEDIDA',
        'COSTO POR UNIDAD',
        'CANTIDAD',
        'TOTAL',
      ],
      ...evento.Costos.map((costo) => {
        const costoUnitario = costo.costo_unitario_x10000 / 10000;
        const cantidad = costo.cantidad_x10000 / 10000;

        return [
          costo.nombre,
          costo.descripcion ?? '',
          costo.unidad_medida ?? '',
          costoUnitario,
          cantidad,
          costoUnitario * cantidad,
        ];
      }),
      [],
      ['TOTAL GASTOS', '', '', '', '', balanceSummary.totalCostos],
    ];

    const gastosSheet = XLSX.utils.aoa_to_sheet(gastosSheetRows);
    this.decorateWorksheet(gastosSheet, {
      titleRows: [0],
      headerRows: [2],
      sectionRows: [gastosSheetRows.length - 1],
      widths: [20, 30, 18, 18, 10, 14],
      moneyColumns: [3, 5],
      decimalColumns: [4],
      wrapColumns: [1],
      autofilterRow: 2,
    });
    XLSX.utils.book_append_sheet(workbook, gastosSheet, 'GASTOS');

    const itemsSheetRows: Array<Array<string | number>> = [
      ['ITEMS CONFIGURADOS'],
      [],
      ['NOMBRE', 'DESCRIPCIÓN', 'PRECIO UNITARIO', 'ORDEN', 'OFERTAS'],
      ...evento.Items.map((item) => [
        item.nombre,
        item.descripcion ?? '',
        Number(item.precio_unitario),
        item.orden,
        item.Ofertas.length > 0
          ? item.Ofertas.map((oferta) => {
              const descripcion = oferta.descripcion?.trim();
              return `${oferta.cantidad} x ${Number(oferta.precio_total)}${
                descripcion ? ` (${descripcion})` : ''
              }`;
            }).join(' · ')
          : 'Sin ofertas',
      ]),
    ];

    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsSheetRows);
    this.decorateWorksheet(itemsSheet, {
      titleRows: [0],
      headerRows: [2],
      widths: [20, 30, 18, 10, 30],
      moneyColumns: [2],
      wrapColumns: [1, 4],
      autofilterRow: 2,
    });
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'ITEMS');

    const allRows = this.buildReservationExportRows(evento.Reservas, true);
    const allSummary = this.buildBalanceSummary(
      evento.Reservas,
      this.resolveCostoTotal(evento),
    );
    const todosSheetRows = this.buildReservationSheetRows('TODOS', allSummary, allRows, true);
    const todosSheet = XLSX.utils.aoa_to_sheet(todosSheetRows);
    this.decorateWorksheet(todosSheet, {
      titleRows: [0],
      headerRows: [8],
      sectionRows: [2, 5, 6],
      widths: [16, 20, 20, 10, 12, 15, 10, 10, 10, 30, 12],
      moneyColumns: [4, 5, 7, 10],
      decimalColumns: [],
      wrapColumns: [9],
      autofilterRow: 8,
    });
    XLSX.utils.book_append_sheet(workbook, todosSheet, 'TODOS');

    for (const sector of evento.Sectores) {
      const reservas = reservasPorSector.get(sector.id) ?? [];
      const sectorSummary = this.buildBalanceSummary(reservas, 0);
      const sectorRows = this.buildReservationExportRows(reservas, false);
      const sectorSheetRows = this.buildReservationSheetRows(
        sector.nombre,
        sectorSummary,
        sectorRows,
        false,
      );
      const sectorSheet = XLSX.utils.aoa_to_sheet(sectorSheetRows);
      this.decorateWorksheet(sectorSheet, {
        titleRows: [0],
        headerRows: [8],
        sectionRows: [2, 5, 6],
        widths: [20, 20, 10, 12, 15, 10, 10, 10, 30, 12],
        moneyColumns: [3, 4, 6, 9],
        decimalColumns: [],
        wrapColumns: [8],
        autofilterRow: 8,
      });
      XLSX.utils.book_append_sheet(
        workbook,
        sectorSheet,
        toSheetName(sector.nombre_hoja ?? sector.nombre, `SECTOR-${sector.id}`),
      );
    }

    const fileName = `${slugifyFileName(evento.nombre || 'evento-venta') || 'evento-venta'}-${id}.xlsx`;
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true,
    }) as Buffer;

    return { buffer, fileName };
  }

  async create(dto: CreateEventoVentaDto) {
    return this.prisma.$transaction(async (tx) => {
      const ramas = await tx.rama.findMany({
        where: { borrado: false },
        orderBy: [{ nombre: 'asc' }],
        select: {
          id: true,
          nombre: true,
        },
      });

      return tx.eventoVenta.create({
        data: {
          nombre: dto.nombre.trim(),
          descripcion: dto.descripcion?.trim() || null,
          fecha_evento: dto.fechaEvento,
          notas: dto.notas?.trim() || null,
          Costos: {
            create: this.mapCostoItemCreates(dto.costos ?? []),
          },
          Sectores: {
            create: [
              ...ramas.map((rama, index) => ({
                nombre: rama.nombre,
                tipo_sector: TIPO_EVENTO_VENTA_SECTOR.RAMA,
                orden: index,
                nombre_hoja: rama.nombre,
                id_rama: rama.id,
              })),
              {
                nombre: 'EXTRAS',
                tipo_sector: TIPO_EVENTO_VENTA_SECTOR.EXTRAS,
                orden: ramas.length,
                nombre_hoja: 'EXTRAS',
              },
            ],
          },
        },
      });
    });
  }

  async update(id: number, dto: UpdateEventoVentaDto) {
    await this.ensureEventoVentaExists(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.costos !== undefined) {
        await tx.eventoVentaCostoItem.updateMany({
          where: {
            id_evento_venta: id,
            borrado: false,
          },
          data: {
            borrado: true,
          },
        });
      }

      return tx.eventoVenta.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
          ...(dto.descripcion !== undefined
            ? { descripcion: dto.descripcion.trim() || null }
            : {}),
          ...(dto.fechaEvento !== undefined ? { fecha_evento: dto.fechaEvento } : {}),
          ...(dto.notas !== undefined ? { notas: dto.notas.trim() || null } : {}),
          ...(dto.costos !== undefined
            ? {
                Costos: {
                  create: this.mapCostoItemCreates(dto.costos),
                },
              }
            : {}),
        },
      });
    });
  }

  async remove(id: number) {
    await this.ensureEventoVentaExists(id);
    await this.prisma.eventoVenta.update({
      where: { id },
      data: { borrado: true },
    });
  }

  async createItem(eventoVentaId: number, dto: CreateEventoVentaItemDto) {
    await this.ensureEventoVentaExists(eventoVentaId);

    const lastItem = await this.prisma.eventoVentaItem.findFirst({
      where: {
        id_evento_venta: eventoVentaId,
      },
      orderBy: [{ orden: 'desc' }, { id: 'desc' }],
      select: {
        orden: true,
      },
    });

    return this.prisma.eventoVentaItem.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        precio_unitario: toDecimal(dto.precioUnitario),
        orden: (lastItem?.orden ?? -1) + 1,
        id_evento_venta: eventoVentaId,
        Ofertas: {
          create: this.mapOfertaCreates(dto.ofertas ?? []),
        },
      },
      include: {
        Ofertas: true,
      },
    });
  }

  async updateItem(
    eventoVentaId: number,
    itemId: number,
    dto: UpdateEventoVentaItemDto,
  ) {
    await this.ensureEventoVentaExists(eventoVentaId);
    await this.ensureItemExists(eventoVentaId, itemId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.ofertas !== undefined) {
        await tx.eventoVentaItemOferta.deleteMany({
          where: {
            id_evento_venta_item: itemId,
          },
        });
      }

      return tx.eventoVentaItem.update({
        where: { id: itemId },
        data: {
          ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
          ...(dto.descripcion !== undefined
            ? { descripcion: dto.descripcion.trim() || null }
            : {}),
          ...(dto.precioUnitario !== undefined
            ? { precio_unitario: toDecimal(dto.precioUnitario) }
            : {}),
          ...(dto.ofertas !== undefined
            ? {
                Ofertas: {
                  create: this.mapOfertaCreates(dto.ofertas),
                },
              }
            : {}),
        },
        include: {
          Ofertas: true,
        },
      });
    });
  }

  async removeItem(eventoVentaId: number, itemId: number) {
    await this.ensureItemExists(eventoVentaId, itemId);
    await this.prisma.eventoVentaItem.update({
      where: { id: itemId },
      data: {
        borrado: true,
        activo: false,
      },
    });
  }

  async createCostoItem(eventoVentaId: number, dto: EventoVentaCostoItemDto) {
    await this.ensureEventoVentaExists(eventoVentaId);

    const lastCosto = await this.prisma.eventoVentaCostoItem.findFirst({
      where: {
        id_evento_venta: eventoVentaId,
        borrado: false,
      },
      orderBy: [{ orden: 'desc' }, { id: 'desc' }],
      select: {
        orden: true,
      },
    });

    return this.prisma.eventoVentaCostoItem.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        unidad_medida: dto.unidadMedida?.trim() || null,
        costo_unitario_x10000: dto.costoUnitarioX10000,
        cantidad_x10000: dto.cantidadX10000,
        orden: (lastCosto?.orden ?? -1) + 1,
        id_evento_venta: eventoVentaId,
      },
    });
  }

  async updateCostoItem(
    eventoVentaId: number,
    costoItemId: number,
    dto: EventoVentaCostoItemDto,
  ) {
    await this.ensureEventoVentaExists(eventoVentaId);
    await this.ensureCostoItemExists(eventoVentaId, costoItemId);

    return this.prisma.eventoVentaCostoItem.update({
      where: { id: costoItemId },
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        unidad_medida: dto.unidadMedida?.trim() || null,
        costo_unitario_x10000: dto.costoUnitarioX10000,
        cantidad_x10000: dto.cantidadX10000,
      },
    });
  }

  async removeCostoItem(eventoVentaId: number, costoItemId: number) {
    await this.ensureCostoItemExists(eventoVentaId, costoItemId);
    await this.prisma.eventoVentaCostoItem.update({
      where: { id: costoItemId },
      data: {
        borrado: true,
      },
    });
  }

  async createReserva(
    eventoVentaId: number,
    dto: CreateEventoVentaReservaDto,
  ) {
    await this.ensureEventoVentaExists(eventoVentaId);

    const item = await this.prisma.eventoVentaItem.findFirst({
      where: {
        id: dto.idItem,
        id_evento_venta: eventoVentaId,
        borrado: false,
      },
      select: {
        id: true,
        nombre: true,
        precio_unitario: true,
      },
    });

    if (!item) {
      throw new NotFoundException('El item indicado no existe en este evento.');
    }

    let sectorId: number | null = dto.idSector ?? null;

    if (sectorId !== null) {
      const sector = await this.prisma.eventoVentaSector.findFirst({
        where: {
          id: sectorId,
          id_evento_venta: eventoVentaId,
          borrado: false,
        },
        select: { id: true },
      });

      if (!sector) {
        throw new NotFoundException('El sector indicado no existe en este evento.');
      }
    }

    if (dto.idVendedorMiembro !== null && dto.idVendedorMiembro !== undefined) {
      const vendedor = await this.prisma.miembro.findFirst({
        where: {
          id: dto.idVendedorMiembro,
          borrado: false,
          OR: [
            {
              Protagonista: {
                is: {
                  borrado: false,
                },
              },
            },
            {
              Adulto: {
                is: {
                  borrado: false,
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (!vendedor) {
        throw new NotFoundException(
          'El vendedor indicado no existe o no es protagonista/adulto.',
        );
      }
    }

    const montoTotal = Number(item.precio_unitario) * dto.cantidad;
    const montoEfectivo = dto.efectivo ?? 0;
    const montoTransferencia = dto.transferencia ?? 0;
    const montoPagado = montoEfectivo + montoTransferencia;
    const saldoPendiente =
      dto.debe !== undefined ? dto.debe : Math.max(montoTotal - montoPagado, 0);
    const cantidadRetirada = dto.retiro ?? 0;

    if (cantidadRetirada > dto.cantidad) {
      throw new BadRequestException(
        'La cantidad retirada no puede ser mayor a la cantidad pedida.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.eventoVentaReserva.create({
        data: {
          id_evento_venta: eventoVentaId,
          id_evento_venta_sector: sectorId,
          id_vendedor_miembro: dto.idVendedorMiembro ?? null,
          comprador_nombre: dto.comprador.trim(),
          cantidad_total: dto.cantidad,
          cantidad_retirada: cantidadRetirada,
          monto_total: toDecimal(montoTotal),
          monto_pagado: toDecimal(montoPagado),
          saldo_pendiente: toDecimal(saldoPendiente),
          cuenta_destino: dto.cuenta?.trim() || null,
        },
      });

      await tx.eventoVentaReservaItem.create({
        data: {
          id_reserva: reserva.id,
          id_item: item.id,
          cantidad: dto.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: toDecimal(montoTotal),
        },
      });

      if (montoEfectivo > 0) {
        await tx.eventoVentaPago.create({
          data: {
            id_reserva: reserva.id,
            tipo_pago: TIPO_EVENTO_VENTA_PAGO.EFECTIVO,
            monto: toDecimal(montoEfectivo),
            cuenta_destino: dto.cuenta?.trim() || null,
          },
        });
      }

      if (montoTransferencia > 0) {
        await tx.eventoVentaPago.create({
          data: {
            id_reserva: reserva.id,
            tipo_pago: TIPO_EVENTO_VENTA_PAGO.TRANSFERENCIA,
            monto: toDecimal(montoTransferencia),
            cuenta_destino: dto.cuenta?.trim() || null,
          },
        });
      }

      return reserva;
    });
  }

  async updateReserva(
    eventoVentaId: number,
    reservaId: number,
    dto: UpdateEventoVentaReservaDto,
  ) {
    await this.ensureEventoVentaExists(eventoVentaId);

    const reserva = await this.prisma.eventoVentaReserva.findFirst({
      where: {
        id: reservaId,
        id_evento_venta: eventoVentaId,
        borrado: false,
      },
      select: {
        id: true,
        comprador_nombre: true,
        cantidad_total: true,
        cantidad_retirada: true,
        saldo_pendiente: true,
        cuenta_destino: true,
        observaciones: true,
        id_evento_venta_sector: true,
        id_vendedor_miembro: true,
        Items: {
          orderBy: [{ id: 'asc' }],
          take: 1,
          select: {
            id: true,
            precio_unitario: true,
          },
        },
        Pagos: {
          where: {
            borrado: false,
          },
          select: {
            tipo_pago: true,
            monto: true,
          },
        },
      },
    });

    if (!reserva) {
      throw new NotFoundException('La reserva indicada no existe en este evento.');
    }

    const reservaItem = reserva.Items[0];

    if (!reservaItem) {
      throw new BadRequestException('La reserva no tiene item asociado para recalcular montos.');
    }

    const sectorId = dto.idSector !== undefined ? dto.idSector : reserva.id_evento_venta_sector;
    const vendedorId =
      dto.idVendedorMiembro !== undefined
        ? dto.idVendedorMiembro
        : reserva.id_vendedor_miembro;

    if (sectorId !== null && sectorId !== undefined) {
      await this.ensureSectorExists(eventoVentaId, sectorId);
    }

    if (vendedorId !== null && vendedorId !== undefined) {
      await this.ensureVendedorValido(vendedorId);
    }

    const efectivoActual = reserva.Pagos
      .filter((pago) => pago.tipo_pago === TIPO_EVENTO_VENTA_PAGO.EFECTIVO)
      .reduce((acc, pago) => acc + Number(pago.monto), 0);
    const transferenciaActual = reserva.Pagos
      .filter((pago) => pago.tipo_pago === TIPO_EVENTO_VENTA_PAGO.TRANSFERENCIA)
      .reduce((acc, pago) => acc + Number(pago.monto), 0);
    const cantidad = dto.cantidad ?? reserva.cantidad_total;
    const efectivo = dto.efectivo ?? efectivoActual;
    const transferencia = dto.transferencia ?? transferenciaActual;
    const montoPagado = efectivo + transferencia;
    const montoTotal = Number(reservaItem.precio_unitario) * cantidad;
    const saldoPendiente =
      dto.debe !== undefined ? dto.debe : Math.max(montoTotal - montoPagado, 0);
    const cantidadRetirada = dto.retiro ?? reserva.cantidad_retirada;

    if (cantidadRetirada > cantidad) {
      throw new BadRequestException(
        'La cantidad retirada no puede ser mayor a la cantidad pedida.',
      );
    }
    const cuentaDestino =
      dto.cuenta !== undefined ? dto.cuenta?.trim() || null : reserva.cuenta_destino;
    const observaciones =
      dto.observacion !== undefined
        ? dto.observacion?.trim() || null
        : reserva.observaciones;

    return this.prisma.$transaction(async (tx) => {
      await tx.eventoVentaPago.updateMany({
        where: {
          id_reserva: reservaId,
          borrado: false,
        },
        data: {
          borrado: true,
        },
      });

      await tx.eventoVentaReservaItem.update({
        where: {
          id: reservaItem.id,
        },
        data: {
          cantidad,
          subtotal: toDecimal(montoTotal),
        },
      });

      const updatedReserva = await tx.eventoVentaReserva.update({
        where: {
          id: reservaId,
        },
        data: {
          ...(dto.comprador !== undefined
            ? { comprador_nombre: dto.comprador.trim() }
            : {}),
          cantidad_total: cantidad,
          cantidad_retirada: cantidadRetirada,
          monto_total: toDecimal(montoTotal),
          monto_pagado: toDecimal(montoPagado),
          saldo_pendiente: toDecimal(saldoPendiente),
          cuenta_destino: cuentaDestino,
          observaciones,
          id_evento_venta_sector: sectorId ?? null,
          id_vendedor_miembro: vendedorId ?? null,
        },
      });

      if (efectivo > 0) {
        await tx.eventoVentaPago.create({
          data: {
            id_reserva: reservaId,
            tipo_pago: TIPO_EVENTO_VENTA_PAGO.EFECTIVO,
            monto: toDecimal(efectivo),
            cuenta_destino: cuentaDestino,
          },
        });
      }

      if (transferencia > 0) {
        await tx.eventoVentaPago.create({
          data: {
            id_reserva: reservaId,
            tipo_pago: TIPO_EVENTO_VENTA_PAGO.TRANSFERENCIA,
            monto: toDecimal(transferencia),
            cuenta_destino: cuentaDestino,
          },
        });
      }

      return updatedReserva;
    });
  }

  async removeReserva(eventoVentaId: number, reservaId: number) {
    await this.ensureEventoVentaExists(eventoVentaId);

    const reserva = await this.prisma.eventoVentaReserva.findFirst({
      where: {
        id: reservaId,
        id_evento_venta: eventoVentaId,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException('La reserva indicada no existe en este evento.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.eventoVentaPago.updateMany({
        where: {
          id_reserva: reservaId,
          borrado: false,
        },
        data: {
          borrado: true,
        },
      });

      await tx.eventoVentaReserva.update({
        where: {
          id: reservaId,
        },
        data: {
          borrado: true,
        },
      });
    });
  }

  async importSpreadsheet(eventoVentaId: number, file: UploadedSpreadsheetFile) {
    await this.ensureEventoVentaExists(eventoVentaId);

    if (!file?.buffer?.length) {
      throw new BadRequestException('Debes adjuntar una planilla válida.');
    }

    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
      raw: true,
      cellDates: true,
    });

    if (workbook.SheetNames.length === 0) {
      throw new BadRequestException('La planilla no contiene hojas.');
    }

    const [ramas, areas, firstItem] = await this.prisma.$transaction([
      this.prisma.rama.findMany({
        where: { borrado: false },
        select: { id: true, nombre: true },
      }),
      this.prisma.area.findMany({
        where: { borrado: false },
        select: { id: true, nombre: true },
      }),
      this.prisma.eventoVentaItem.findFirst({
        where: {
          id_evento_venta: eventoVentaId,
          borrado: false,
        },
        orderBy: [{ orden: 'asc' }, { id: 'asc' }],
        select: { id: true },
      }),
    ]);

    const defaultItemId =
      firstItem?.id ??
      (
        await this.prisma.eventoVentaItem.create({
          data: {
            id_evento_venta: eventoVentaId,
            nombre: 'Porción',
            descripcion: 'Item creado automáticamente al importar la planilla.',
            precio_unitario: toDecimal(0),
          },
          select: { id: true },
        })
      ).id;

    return this.prisma.$transaction(async (tx) => {
      const previousReservaIds = (
        await tx.eventoVentaReserva.findMany({
          where: { id_evento_venta: eventoVentaId, borrado: false },
          select: { id: true },
        })
      ).map((item: { id: number }) => item.id);

      if (previousReservaIds.length > 0) {
        await tx.eventoVentaPago.updateMany({
          where: {
            id_reserva: { in: previousReservaIds },
            borrado: false,
          },
          data: {
            borrado: true,
          },
        });
      }

      await tx.eventoVentaReserva.updateMany({
        where: { id_evento_venta: eventoVentaId, borrado: false },
        data: { borrado: true },
      });
      await tx.eventoVentaSector.updateMany({
        where: { id_evento_venta: eventoVentaId, borrado: false },
        data: { borrado: true },
      });
      await tx.eventoVentaHojaImportada.updateMany({
        where: { id_evento_venta: eventoVentaId, borrado: false },
        data: { borrado: true },
      });

      let createdReservations = 0;
      const errors: Array<{
        rowNumber: number;
        identifier: string;
        message: string;
      }> = [];

      for (let sheetIndex = 0; sheetIndex < workbook.SheetNames.length; sheetIndex += 1) {
        const sheetName = workbook.SheetNames[sheetIndex];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: true,
        }) as SheetRow[];

        if (rows.length === 0) {
          continue;
        }

        const normalizedSheetName = normalizeText(sheetName);
        const sheetKind = this.resolveSheetKind(normalizedSheetName);
        const visibleName =
          sheetKind === TIPO_EVENTO_VENTA_HOJA.BALANCE
            ? 'BALANCE'
            : sheetKind === TIPO_EVENTO_VENTA_HOJA.GENERAL
              ? 'GENERAL'
              : sheetName.trim();

        await tx.eventoVentaHojaImportada.create({
          data: {
            id_evento_venta: eventoVentaId,
            nombre_hoja: sheetName,
            nombre_visible: visibleName,
            tipo_hoja: sheetKind,
            orden: sheetIndex,
            contenido: rows.map((currentRow) =>
              currentRow.map((cell) => toJsonValue(cell)),
            ) as Prisma.InputJsonValue,
          },
        });

        if (sheetKind !== TIPO_EVENTO_VENTA_HOJA.SECTOR) {
          continue;
        }

        const sectorResolution = this.resolveSectorSheet(
          sheetName,
          ramas,
          areas,
        );
        const summary = this.extractSectorSummary(rows);

        const sector = await tx.eventoVentaSector.create({
          data: {
            id_evento_venta: eventoVentaId,
            nombre: sectorResolution.displayName,
            tipo_sector: sectorResolution.type,
            id_rama: sectorResolution.ramaId,
            id_area: sectorResolution.areaId,
            orden: sheetIndex,
            nombre_hoja: sheetName,
            resumen_total_vendido: summary.totalVendido,
            resumen_total_retirado: summary.totalRetirado,
            monto_rendido_efectivo: toNullableDecimal(summary.rendidoEfectivo),
            monto_rendido_transferencia: toNullableDecimal(
              summary.rendidoTransferencia,
            ),
            monto_deuda_informado: toNullableDecimal(summary.deudaInformada),
          },
        });

        for (let rowIndex = 2; rowIndex < rows.length; rowIndex += 1) {
          const parsed = this.parseReservationRow(rows[rowIndex], rowIndex + 1);
          if (!parsed) {
            continue;
          }

          try {
            const reserva = await tx.eventoVentaReserva.create({
              data: {
                id_evento_venta: eventoVentaId,
                id_evento_venta_sector: sector.id,
                comprador_nombre: parsed.compradorNombre,
                vendedor_nombre: parsed.vendedorNombre,
                cantidad_total: parsed.cantidadTotal,
                cantidad_retirada: parsed.cantidadRetirada,
                monto_total: toDecimal(parsed.montoTotal),
                monto_pagado: toDecimal(parsed.montoPagado),
                saldo_pendiente: toDecimal(parsed.saldoPendiente),
                cuenta_destino: parsed.cuentaDestino,
                observaciones: parsed.observaciones,
                fila_origen: parsed.rowNumber,
              },
            });

            await tx.eventoVentaReservaItem.create({
              data: {
                id_reserva: reserva.id,
                id_item: defaultItemId,
                cantidad: parsed.cantidadTotal,
                precio_unitario: toDecimal(parsed.precioUnitario),
                subtotal: toDecimal(parsed.montoTotal),
              },
            });

            if (parsed.montoEfectivo > 0) {
              await tx.eventoVentaPago.create({
                data: {
                  id_reserva: reserva.id,
                  tipo_pago: TIPO_EVENTO_VENTA_PAGO.EFECTIVO,
                  monto: toDecimal(parsed.montoEfectivo),
                  cuenta_destino: parsed.cuentaDestino,
                  fila_origen: parsed.rowNumber,
                },
              });
            }

            if (parsed.montoTransferencia > 0) {
              await tx.eventoVentaPago.create({
                data: {
                  id_reserva: reserva.id,
                  tipo_pago: TIPO_EVENTO_VENTA_PAGO.TRANSFERENCIA,
                  monto: toDecimal(parsed.montoTransferencia),
                  cuenta_destino: parsed.cuentaDestino,
                  fila_origen: parsed.rowNumber,
                },
              });
            }

            createdReservations += 1;
          } catch (error) {
            errors.push({
              rowNumber: rowIndex + 1,
              identifier: parsed.compradorNombre,
              message:
                error instanceof Error
                  ? error.message
                  : 'No se pudo importar la fila.',
            });
          }
        }
      }

      return {
        totalRows: createdReservations + errors.length,
        createdCount: createdReservations,
        errorCount: errors.length,
        created: [],
        errors,
      };
    });
  }

  private encargadoJuvenilMemberSelect() {
    return {
      id: true,
      id_cuenta: true,
      nombre: true,
      apellidos: true,
      dni: true,
      MiembroRama: {
        where: {
          borrado: false,
          fecha_egreso: null,
        },
        select: {
          Rama: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: {
          fecha_ingreso: 'desc',
        },
        take: 1,
      },
    } satisfies Prisma.MiembroSelect;
  }

  private mapEncargadoJuvenilMember(
    miembro: {
      id: number;
      id_cuenta: number;
      nombre: string;
      apellidos: string;
      dni: string;
      MiembroRama: Array<{
        Rama: {
          id: number;
          nombre: string;
        };
      }>;
    },
    alreadyAssigned: boolean,
  ) {
    return {
      id: miembro.id,
      nombre: miembro.nombre,
      apellidos: miembro.apellidos,
      dni: miembro.dni,
      ramaActualNombre: miembro.MiembroRama[0]?.Rama.nombre ?? null,
      alreadyAssigned,
    };
  }

  private buildEncargadoJuvenilEligibleWhere(): Prisma.MiembroWhereInput {
    return {
      borrado: false,
      Protagonista: {
        is: {
          borrado: false,
          activo: true,
        },
      },
      Cuenta: {
        is: {
          borrado: false,
        },
      },
      MiembroRama: {
        some: {
          borrado: false,
          fecha_egreso: null,
        },
      },
    };
  }

  private async ensureEncargadoJuvenilRole() {
    const role = await this.prisma.role.findUnique({
      where: {
        nombre: ENCARGADO_JUVENIL_EVENTOS_VENTA_ROLE,
      },
      select: {
        id: true,
      },
    });

    if (!role) {
      throw new NotFoundException(
        'El rol de encargado juvenil de eventos de venta no está configurado en el sistema.',
      );
    }

    return role;
  }

  private async ensureEncargadoJuvenilEligibleMember(memberId: number) {
    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id: memberId,
        ...this.buildEncargadoJuvenilEligibleWhere(),
      },
      select: this.encargadoJuvenilMemberSelect(),
    });

    if (!miembro) {
      throw new BadRequestException(
        'El miembro indicado no es elegible como encargado juvenil de eventos de venta.',
      );
    }

    return miembro;
  }

  private async ensureEventoVentaExists(id: number) {
    const existing = await this.prisma.eventoVenta.findFirst({
      where: { id, borrado: false },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('El evento de venta indicado no existe.');
    }

    return existing;
  }

  private async ensureItemExists(eventoVentaId: number, itemId: number) {
    const item = await this.prisma.eventoVentaItem.findFirst({
      where: {
        id: itemId,
        id_evento_venta: eventoVentaId,
        borrado: false,
      },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException('El item indicado no existe en este evento.');
    }

    return item;
  }

  private mapOfertaCreates(ofertas: CreateEventoVentaItemOfertaDto[]) {
    return ofertas.map((oferta) => ({
      cantidad: oferta.cantidad,
      precio_total: toDecimal(oferta.precioTotal),
      descripcion: oferta.descripcion?.trim() || null,
    }));
  }

  private mapCostoItemCreates(costos: EventoVentaCostoItemDto[]) {
    return costos.map((costo, index) => ({
      nombre: costo.nombre.trim(),
      descripcion: costo.descripcion?.trim() || null,
      unidad_medida: costo.unidadMedida?.trim() || null,
      costo_unitario_x10000: costo.costoUnitarioX10000,
      cantidad_x10000: costo.cantidadX10000,
      orden: index,
    }));
  }

  private async ensureSectorExists(eventoVentaId: number, sectorId: number) {
    const sector = await this.prisma.eventoVentaSector.findFirst({
      where: {
        id: sectorId,
        id_evento_venta: eventoVentaId,
        borrado: false,
      },
      select: { id: true },
    });

    if (!sector) {
      throw new NotFoundException('El sector indicado no existe en este evento.');
    }
  }

  private async ensureCostoItemExists(eventoVentaId: number, costoItemId: number) {
    const costoItem = await this.prisma.eventoVentaCostoItem.findFirst({
      where: {
        id: costoItemId,
        id_evento_venta: eventoVentaId,
        borrado: false,
      },
      select: { id: true },
    });

    if (!costoItem) {
      throw new NotFoundException(
        'El gasto indicado no existe en este evento de venta.',
      );
    }

    return costoItem;
  }

  private async ensureVendedorValido(miembroId: number) {
    const vendedor = await this.prisma.miembro.findFirst({
      where: {
        id: miembroId,
        borrado: false,
        OR: [
          {
            Protagonista: {
              is: {
                borrado: false,
              },
            },
          },
          {
            Adulto: {
              is: {
                borrado: false,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!vendedor) {
      throw new NotFoundException(
        'El vendedor indicado no existe o no es protagonista/adulto.',
      );
    }
  }

  private buildSectorSummary(
    reservas: Array<{
      cantidad_total: number;
      cantidad_retirada: number;
      monto_total: Prisma.Decimal | string | number;
      saldo_pendiente: Prisma.Decimal | string | number;
      cuenta_destino: string | null;
      Pagos: Array<{
        tipo_pago: TIPO_EVENTO_VENTA_PAGO;
        monto: Prisma.Decimal | string | number;
      }>;
    }>,
  ) {
    let totalVendidas = 0;
    let totalRetiradas = 0;
    let totalPagadoEf = 0;
    let totalPagadoTransf = 0;
    let totalDebe = 0;
    let rendicion = 0;

    for (const reserva of reservas) {
      const efectivo = reserva.Pagos
        .filter((pago) => pago.tipo_pago === TIPO_EVENTO_VENTA_PAGO.EFECTIVO)
        .reduce((acc, pago) => acc + Number(pago.monto), 0);
      const transferencia = reserva.Pagos
        .filter((pago) => pago.tipo_pago === TIPO_EVENTO_VENTA_PAGO.TRANSFERENCIA)
        .reduce((acc, pago) => acc + Number(pago.monto), 0);
      const cuenta = reserva.cuenta_destino?.trim().toUpperCase() ?? '';

      totalVendidas += reserva.cantidad_total;
      totalRetiradas += reserva.cantidad_retirada;
      totalPagadoEf += efectivo;
      totalPagadoTransf += transferencia;
      totalDebe += Number(reserva.saldo_pendiente);

      if ((efectivo > 0 || transferencia > 0) && cuenta !== '' && cuenta !== 'GRUPO') {
        rendicion += Number(reserva.monto_total);
      }
    }

    return {
      totalVendidas,
      totalRetiradas,
      totalDinero: reservas.reduce((acc, reserva) => acc + Number(reserva.monto_total), 0),
      totalPagadoEf,
      totalPagadoTransf,
      totalDebe,
      rendicion,
    };
  }

  private buildBalanceSummary(
    reservas: Array<{
      comprador_nombre: string;
      cantidad_total: number;
      cantidad_retirada: number;
      monto_total: Prisma.Decimal | string | number;
      saldo_pendiente: Prisma.Decimal | string | number;
      cuenta_destino: string | null;
      Pagos: Array<{
        tipo_pago: TIPO_EVENTO_VENTA_PAGO;
        monto: Prisma.Decimal | string | number;
      }>;
    }>,
    totalCostos: number,
  ) {
    const totalVendidas = reservas.reduce(
      (acc, reserva) => acc + reserva.cantidad_total,
      0,
    );
    const totalRetiradas = reservas.reduce(
      (acc, reserva) => acc + reserva.cantidad_retirada,
      0,
    );
    const totalIngresos = reservas.reduce(
      (acc, reserva) => acc + Number(reserva.monto_total),
      0,
    );
    const totalCobradoEfectivo = reservas.reduce((acc, reserva) => {
      return (
        acc +
        reserva.Pagos.filter(
          (pago) => pago.tipo_pago === TIPO_EVENTO_VENTA_PAGO.EFECTIVO,
        ).reduce((sum, pago) => sum + Number(pago.monto), 0)
      );
    }, 0);
    const totalCobradoTransferencia = reservas.reduce((acc, reserva) => {
      return (
        acc +
        reserva.Pagos.filter(
          (pago) => pago.tipo_pago === TIPO_EVENTO_VENTA_PAGO.TRANSFERENCIA,
        ).reduce((sum, pago) => sum + Number(pago.monto), 0)
      );
    }, 0);
    const totalCobrado = totalCobradoEfectivo + totalCobradoTransferencia;
    const totalPendiente = reservas.reduce(
      (acc, reserva) => acc + Number(reserva.saldo_pendiente),
      0,
    );
    const totalRendido = reservas.reduce((acc, reserva) => {
      const cuenta = normalizeAccount(reserva.cuenta_destino ?? '');
      const cobradoReserva = reserva.Pagos.reduce(
        (sum, pago) => sum + Number(pago.monto),
        0,
      );

      return cuenta === 'GRUPO' ? acc + cobradoReserva : acc;
    }, 0);
    const totalFaltaRendir = Math.max(totalCobrado - totalRendido, 0);

    return {
      totalVendidas,
      totalRetiradas,
      totalPorRetirar: Math.max(totalVendidas - totalRetiradas, 0),
      totalIngresos,
      totalCobradoEfectivo,
      totalCobradoTransferencia,
      totalPendiente,
      totalCostos,
      totalRendido,
      totalFaltaRendir,
      balanceCobrado: totalCobrado - totalCostos,
      balanceProyectado: totalIngresos - totalCostos,
    };
  }

  private buildReservationExportRows(
    reservas: Array<{
      comprador_nombre: string;
      vendedor_nombre: string | null;
      cantidad_total: number;
      cantidad_retirada: number;
      monto_total: Prisma.Decimal | string | number;
      saldo_pendiente: Prisma.Decimal | string | number;
      cuenta_destino: string | null;
      observaciones: string | null;
      Vendedor: {
        id: number;
        nombre: string;
        apellidos: string;
      } | null;
      Sector: {
        id: number;
        nombre: string;
      } | null;
      Pagos: Array<{
        tipo_pago: TIPO_EVENTO_VENTA_PAGO;
        monto: Prisma.Decimal | string | number;
      }>;
    }>,
    includeSector: boolean,
  ) {
    return reservas.map((reserva) => {
      const montoEfectivo = reserva.Pagos.filter(
        (pago) => pago.tipo_pago === TIPO_EVENTO_VENTA_PAGO.EFECTIVO,
      ).reduce((acc, pago) => acc + Number(pago.monto), 0);
      const montoTransferencia = reserva.Pagos.filter(
        (pago) => pago.tipo_pago === TIPO_EVENTO_VENTA_PAGO.TRANSFERENCIA,
      ).reduce((acc, pago) => acc + Number(pago.monto), 0);
      const vendedor =
        reserva.Vendedor !== null
          ? `${reserva.Vendedor.nombre} ${reserva.Vendedor.apellidos}`.trim()
          : reserva.vendedor_nombre?.trim() || '';

      return [
        ...(includeSector ? [reserva.Sector?.nombre ?? ''] : []),
        reserva.comprador_nombre,
        vendedor,
        reserva.cantidad_total,
        montoEfectivo,
        montoTransferencia,
        reserva.cuenta_destino ?? '',
        Number(reserva.saldo_pendiente),
        reserva.cantidad_retirada,
        reserva.observaciones ?? '',
        Number(reserva.monto_total),
      ];
    });
  }

  private buildReservationSheetRows(
    title: string,
    summary: {
      totalVendidas: number;
      totalRetiradas: number;
      totalPorRetirar: number;
      totalIngresos: number;
      totalCobradoEfectivo: number;
      totalCobradoTransferencia: number;
      totalPendiente: number;
      totalCostos: number;
      totalRendido: number;
      totalFaltaRendir: number;
      balanceCobrado: number;
      balanceProyectado: number;
    },
    rows: Array<Array<string | number>>,
    includeSector: boolean,
  ): Array<Array<string | number>> {
    return [
      [title.toUpperCase()],
      [],
      ['PORCIONES', 'Total', summary.totalVendidas, '', 'PLATA', 'Total', summary.totalIngresos],
      ['PORCIONES', 'Retiradas', summary.totalRetiradas, '', 'PLATA', 'Pagado efectivo', summary.totalCobradoEfectivo],
      ['PORCIONES', 'Por retirar', summary.totalPorRetirar, '', 'PLATA', 'Pagado transferencia', summary.totalCobradoTransferencia],
      ['PLATA', 'Pendiente', summary.totalPendiente, '', 'RENDICIÓN', 'Total', summary.totalCobradoEfectivo + summary.totalCobradoTransferencia],
      ['RENDICIÓN', 'Ya rendido', summary.totalRendido, '', 'RENDICIÓN', 'Falta rendir', summary.totalFaltaRendir],
      [],
      [
        ...(includeSector ? ['SECTOR'] : []),
        'COMPRADOR',
        'VENDEDOR',
        'CANTIDAD',
        'EFECTIVO',
        'TRANSFERENCIA',
        'CUENTA',
        'DEBE',
        'RETIRADAS',
        'OBSERVACIÓN',
        'TOTAL',
      ],
      ...rows,
    ];
  }

  private decorateWorksheet(
    worksheet: XLSX.WorkSheet,
    config: {
      titleRows?: number[];
      headerRows?: number[];
      sectionRows?: number[];
      widths: number[];
      moneyColumns?: number[];
      decimalColumns?: number[];
      wrapColumns?: number[];
      autofilterRow?: number;
    },
  ) {
    worksheet['!cols'] = config.widths.map((width) => ({ wch: width }));

    if (!worksheet['!ref']) {
      return;
    }

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const titleStyle = {
      font: { bold: true, sz: 14, color: { rgb: '1F2937' } },
      fill: { fgColor: { rgb: 'E5EEF7' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3F6E8C' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };
    const sectionStyle = {
      font: { bold: true, color: { rgb: '1F2937' } },
      fill: { fgColor: { rgb: 'DCE6F1' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    };

    for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
      for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
        const cell = worksheet[cellAddress];
        if (!cell) {
          continue;
        }

        if (config.titleRows?.includes(rowIndex)) {
          cell.s = { ...(cell.s ?? {}), ...titleStyle };
        } else if (config.headerRows?.includes(rowIndex)) {
          cell.s = { ...(cell.s ?? {}), ...headerStyle };
        } else if (config.sectionRows?.includes(rowIndex)) {
          cell.s = { ...(cell.s ?? {}), ...sectionStyle };
        }

        if (
          typeof cell.v === 'number' &&
          config.moneyColumns?.includes(columnIndex)
        ) {
          cell.z = '$ #,##0.00';
        }

        if (
          typeof cell.v === 'number' &&
          config.decimalColumns?.includes(columnIndex)
        ) {
          cell.z = '0.0000';
        }

        if (config.wrapColumns?.includes(columnIndex)) {
          cell.s = {
            ...(cell.s ?? {}),
            alignment: {
              vertical: 'top',
              wrapText: true,
            },
          };
        }
      }
    }

    if (config.autofilterRow !== undefined) {
      worksheet['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: config.autofilterRow, c: 0 },
          e: { r: config.autofilterRow, c: config.widths.length - 1 },
        }),
      };
    }
  }

  private resolveCostoPorPorcion(evento: Awaited<ReturnType<EventosVentaService['findOne']>>) {
    const cantidadVendida = evento.resumen.cantidadVendida;
    if (cantidadVendida <= 0) {
      return 0;
    }

    return Number((this.resolveCostoTotal(evento) / cantidadVendida).toFixed(2));
  }

  private resolveCostoTotal(evento: Awaited<ReturnType<EventosVentaService['findOne']>>) {
    return evento.Costos.reduce((acc, costo) => {
      const costoUnitario = costo.costo_unitario_x10000 / 10000;
      const cantidad = costo.cantidad_x10000 / 10000;
      return acc + costoUnitario * cantidad;
    }, 0);
  }

  private resolveSheetKind(sheetName: string) {
    if (sheetName.startsWith('BALANCE')) {
      return TIPO_EVENTO_VENTA_HOJA.BALANCE;
    }

    if (sheetName.startsWith('GENERAL')) {
      return TIPO_EVENTO_VENTA_HOJA.GENERAL;
    }

    if (sheetName.startsWith('HOJA ')) {
      return TIPO_EVENTO_VENTA_HOJA.OTRA;
    }

    return TIPO_EVENTO_VENTA_HOJA.SECTOR;
  }

  private resolveSectorSheet(
    rawSheetName: string,
    ramas: Array<{ id: number; nombre: string }>,
    areas: Array<{ id: number; nombre: string }>,
  ): SectorSheetResolution {
    const normalized = normalizeText(rawSheetName);

    if (normalized === 'EXTRAS') {
      return {
        displayName: 'EXTRAS',
        type: TIPO_EVENTO_VENTA_SECTOR.EXTRAS,
        ramaId: null,
        areaId: null,
      };
    }

    const rama = ramas.find(
      (item) => normalizeText(item.nombre) === normalized.replace(/\s+/g, ' '),
    );

    if (rama) {
      return {
        displayName: rama.nombre,
        type: TIPO_EVENTO_VENTA_SECTOR.RAMA,
        ramaId: rama.id,
        areaId: null,
      };
    }

    const area = areas.find((item) => normalizeText(item.nombre) === normalized);

    if (area) {
      return {
        displayName: area.nombre,
        type: TIPO_EVENTO_VENTA_SECTOR.AREA,
        ramaId: null,
        areaId: area.id,
      };
    }

    return {
      displayName: rawSheetName.trim(),
      type: TIPO_EVENTO_VENTA_SECTOR.OTRO,
      ramaId: null,
      areaId: null,
    };
  }

  private extractSectorSummary(rows: SheetRow[]) {
    const firstRow = rows[0] ?? [];
    let rendidoEfectivo: number | null = null;
    let rendidoTransferencia: number | null = null;
    let deudaInformada: number | null = null;

    for (const row of rows) {
      const label = toOptionalString(row[9]);
      const amount = toOptionalNumber(row[10]);
      if (!label || amount === null) {
        continue;
      }

      const normalizedLabel = normalizeText(label);
      if (normalizedLabel.includes('PAGADO EF')) {
        rendidoEfectivo = amount;
      } else if (normalizedLabel.includes('PAGADO TRANSF')) {
        rendidoTransferencia = amount;
      } else if (normalizedLabel === 'DEBE') {
        deudaInformada = amount;
      }
    }

    return {
      totalVendido: toOptionalNumber(firstRow[1]),
      totalRetirado: toOptionalNumber(firstRow[6]),
      rendidoEfectivo,
      rendidoTransferencia,
      deudaInformada,
    };
  }

  private parseReservationRow(row: SheetRow, rowNumber: number) {
    const compradorNombre = toOptionalString(row[0]);
    const vendedorNombre = toOptionalString(row[1]);
    const cantidadTotal = Math.max(0, Math.round(toOptionalNumber(row[2]) ?? 0));
    const montoEfectivo = toOptionalNumber(row[3]) ?? 0;
    const montoTransferencia = toOptionalNumber(row[4]) ?? 0;
    const cuentaDestino = toOptionalString(row[5]);
    const saldoPendiente = toOptionalNumber(row[6]) ?? 0;
    const cantidadRetirada = Math.max(0, Math.round(toOptionalNumber(row[7]) ?? 0));
    const extraLabel = toOptionalString(row[9]);
    const extraAmount = toOptionalNumber(row[10]);

    const hasBusinessData =
      compradorNombre !== null ||
      vendedorNombre !== null ||
      cantidadTotal > 0 ||
      montoEfectivo > 0 ||
      montoTransferencia > 0 ||
      saldoPendiente !== 0 ||
      cantidadRetirada > 0;

    if (!hasBusinessData) {
      return null;
    }

    if (!compradorNombre) {
      return null;
    }

    const montoPagado = sumNumbers([montoEfectivo, montoTransferencia]);
    const montoTotal = Math.max(0, (montoPagado ?? 0) + saldoPendiente);
    const precioUnitario =
      cantidadTotal > 0 ? Number((montoTotal / cantidadTotal).toFixed(2)) : 0;
    const observationParts = [extraLabel, extraAmount !== null ? String(extraAmount) : null]
      .filter((value) => value !== null)
      .join(': ');

    return {
      rowNumber,
      compradorNombre,
      vendedorNombre,
      cantidadTotal,
      montoEfectivo,
      montoTransferencia,
      montoPagado,
      saldoPendiente,
      cantidadRetirada,
      cuentaDestino,
      montoTotal,
      precioUnitario,
      observaciones: observationParts || null,
    };
  }
}
