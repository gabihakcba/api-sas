import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ESTADO_CICLO, Prisma, SCOPE } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import {
  hasSoftDeleteAuditAccess,
  hasUnrestrictedAccess,
} from '../auth/utils/unrestricted-access.util';
import { PrismaService } from '../prisma/prisma.service';
import { CiclosProgramaQueryDto } from './dto/ciclos-programa-query.dto';
import { CreateCicloProgramaDto } from './dto/create-ciclo-programa.dto';
import { UpdateCicloProgramaDto } from './dto/update-ciclo-programa.dto';
import { PublicConfigService } from '../public-config/public-config.service';
import {
  escapeHtml,
  renderHtmlToPdf,
  sanitizeHtmlForPdf,
} from '../common/pdf/render-html-to-pdf';
import { formatArgentinaDate } from '../common/utils/argentina-datetime.util';

type CicloProgramaPdfEvent = {
  id: number;
  nombre: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  terminado: boolean;
  TipoEvento: {
    id: number;
    nombre: string | null;
  } | null;
};

type CicloProgramaPdfDetail = {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: ESTADO_CICLO;
  diagnostico: string | null;
  planificacion: string | null;
  desarrollo: string | null;
  evaluacion: string | null;
  Rama: {
    id: number;
    nombre: string;
  };
  Evento: CicloProgramaPdfEvent[];
};

type BrandingData = {
  nombre_grupo: string;
  url_logo: string | null;
};

@Injectable()
export class CiclosProgramaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicConfigService: PublicConfigService,
  ) {}

  async findAll(user: AuthenticatedUser, query: CiclosProgramaQueryDto) {
    this.ensureModuleAccess(user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const trimmedQuery = query.q?.trim();
    const numericQuery =
      trimmedQuery && /^\d+$/.test(trimmedQuery) ? Number(trimmedQuery) : null;
    const includeDeleted =
      query.includeDeleted === true && hasSoftDeleteAuditAccess(user);
    const where = this.mergeCicloWhere(
      {
        ...(includeDeleted ? {} : { borrado: false }),
        ...(trimmedQuery
          ? {
              OR: [
                { nombre: { contains: trimmedQuery, mode: 'insensitive' } },
                {
                  descripcion: {
                    contains: trimmedQuery,
                    mode: 'insensitive',
                  },
                },
                ...(numericQuery ? [{ id: numericQuery }] : []),
              ],
            }
          : {}),
        ...(query.idRama !== undefined ? { id_rama: query.idRama } : {}),
        ...(query.estado !== undefined ? { estado: query.estado } : {}),
        ...this.buildCicloDateWhere(query.fechaDesde, query.fechaHasta),
      },
      this.buildCicloScopeWhere(user),
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cicloPrograma.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fecha_inicio: 'desc' }, { id: 'desc' }],
        select: this.cicloSelect(),
      }),
      this.prisma.cicloPrograma.count({ where }),
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
    this.ensureModuleAccess(user);

    const ramas = await this.prisma.rama.findMany({
      where: this.mergeRamaWhere(
        { borrado: false },
        this.buildRamaScopeWhere(user),
      ),
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
      },
    });

    return {
      ramas,
      estados: Object.values(ESTADO_CICLO),
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    this.ensureModuleAccess(user);

    const ciclo = await this.prisma.cicloPrograma.findFirst({
      where: this.mergeCicloWhere(
        {
          id,
          borrado: false,
        },
        this.buildCicloScopeWhere(user),
      ),
      select: this.cicloDetailSelect(),
    });

    if (!ciclo) {
      throw new NotFoundException('El ciclo de programa indicado no existe.');
    }

    return ciclo;
  }

  async exportPdf(id: number, user: AuthenticatedUser) {
    this.ensureModuleAccess(user);

    const ciclo = await this.prisma.cicloPrograma.findFirst({
      where: this.mergeCicloWhere(
        {
          id,
          borrado: false,
        },
        this.buildCicloScopeWhere(user),
      ),
      select: this.cicloDetailSelect(),
    });

    if (!ciclo) {
      throw new NotFoundException('El ciclo de programa indicado no existe.');
    }

    const branding = await this.publicConfigService.getConfiguracionGrupo();
    const html = this.buildCicloPdfHtml(ciclo, branding);
    const buffer = await renderHtmlToPdf(html);
    const slug = ciclo.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return {
      filename: `${slug || 'ciclo-programa'}.pdf`,
      buffer,
    };
  }

  async create(user: AuthenticatedUser, dto: CreateCicloProgramaDto) {
    this.ensureModuleAccess(user);

    this.validateDates(dto.fechaInicio, dto.fechaFin);
    await this.ensureRamaExists(dto.idRama);
    await this.ensureRamaWithinScope(dto.idRama, user);

    const ciclo = await this.prisma.cicloPrograma.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        fecha_inicio: dto.fechaInicio,
        fecha_fin: dto.fechaFin,
        estado: dto.estado ?? ESTADO_CICLO.DIAGNOSTICO,
        diagnostico: dto.diagnostico ?? null,
        planificacion: dto.planificacion ?? null,
        desarrollo: dto.desarrollo ?? null,
        evaluacion: dto.evaluacion ?? null,
        id_rama: dto.idRama,
      },
      select: { id: true },
    });

    return this.findOne(ciclo.id, user);
  }

  async update(
    user: AuthenticatedUser,
    id: number,
    dto: UpdateCicloProgramaDto,
  ) {
    this.ensureModuleAccess(user);

    const current = await this.ensureExists(id, user);
    const nextFechaInicio = dto.fechaInicio ?? current.fecha_inicio;
    const nextFechaFin = dto.fechaFin ?? current.fecha_fin;

    this.validateDates(nextFechaInicio, nextFechaFin);

    if (dto.idRama !== undefined) {
      if (!hasUnrestrictedAccess(user)) {
        throw new ForbiddenException(
          'Solo perfiles de grupo pueden reasignar la rama de un ciclo de programa.',
        );
      }
      await this.ensureRamaExists(dto.idRama);
      await this.ensureRamaWithinScope(dto.idRama, user);
    }

    await this.prisma.cicloPrograma.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion.trim() || null }
          : {}),
        ...(dto.fechaInicio !== undefined
          ? { fecha_inicio: dto.fechaInicio }
          : {}),
        ...(dto.fechaFin !== undefined ? { fecha_fin: dto.fechaFin } : {}),
        ...(dto.estado !== undefined ? { estado: dto.estado } : {}),
        ...(dto.diagnostico !== undefined
          ? { diagnostico: dto.diagnostico || null }
          : {}),
        ...(dto.planificacion !== undefined
          ? { planificacion: dto.planificacion || null }
          : {}),
        ...(dto.desarrollo !== undefined
          ? { desarrollo: dto.desarrollo || null }
          : {}),
        ...(dto.evaluacion !== undefined
          ? { evaluacion: dto.evaluacion || null }
          : {}),
        ...(dto.idRama !== undefined ? { id_rama: dto.idRama } : {}),
      },
    });

    return this.findOne(id, user);
  }

  async remove(user: AuthenticatedUser, id: number) {
    this.ensureModuleAccess(user);

    await this.ensureExists(id, user);

    await this.prisma.cicloPrograma.update({
      where: { id },
      data: { borrado: true },
    });
  }

  async ensureCicloExistsForEvento(idCicloPrograma: number, ramaIds: number[]) {
    const ciclo = await this.prisma.cicloPrograma.findFirst({
      where: {
        id: idCicloPrograma,
        borrado: false,
      },
      select: {
        id: true,
        id_rama: true,
      },
    });

    if (!ciclo) {
      throw new NotFoundException('El ciclo de programa indicado no existe.');
    }

    if (!ramaIds.includes(ciclo.id_rama)) {
      throw new BadRequestException(
        'El evento debe afectar la misma rama del ciclo de programa seleccionado.',
      );
    }

    return ciclo;
  }

  private async ensureExists(id: number, user: AuthenticatedUser) {
    const ciclo = await this.prisma.cicloPrograma.findFirst({
      where: this.mergeCicloWhere(
        { id, borrado: false },
        this.buildCicloScopeWhere(user),
      ),
      select: {
        id: true,
        id_rama: true,
        fecha_inicio: true,
        fecha_fin: true,
      },
    });

    if (!ciclo) {
      throw new NotFoundException('El ciclo de programa indicado no existe.');
    }

    return ciclo;
  }

  private async ensureRamaExists(idRama: number) {
    const rama = await this.prisma.rama.findFirst({
      where: {
        id: idRama,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!rama) {
      throw new NotFoundException('La rama indicada no existe.');
    }
  }

  private async ensureRamaWithinScope(idRama: number, user: AuthenticatedUser) {
    if (hasUnrestrictedAccess(user)) {
      return;
    }

    const allowedRamaIds = this.extractScopedRamaIds(user);

    if (!allowedRamaIds.includes(idRama)) {
      throw new ForbiddenException(
        'La rama indicada no está dentro del alcance del usuario.',
      );
    }
  }

  private validateDates(fechaInicio: Date, fechaFin: Date) {
    if (fechaFin < fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio.',
      );
    }
  }

  private buildCicloDateWhere(
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Prisma.CicloProgramaWhereInput {
    if (!fechaDesde && !fechaHasta) {
      return {};
    }

    return {
      AND: [
        ...(fechaDesde
          ? [
              {
                fecha_fin: {
                  gte: fechaDesde,
                },
              } satisfies Prisma.CicloProgramaWhereInput,
            ]
          : []),
        ...(fechaHasta
          ? [
              {
                fecha_inicio: {
                  lte: fechaHasta,
                },
              } satisfies Prisma.CicloProgramaWhereInput,
            ]
          : []),
      ],
    };
  }

  private cicloSelect() {
    return {
      id: true,
      nombre: true,
      descripcion: true,
      fecha_inicio: true,
      fecha_fin: true,
      estado: true,
      diagnostico: true,
      planificacion: true,
      desarrollo: true,
      evaluacion: true,
      borrado: true,
      Rama: {
        select: {
          id: true,
          nombre: true,
        },
      },
      _count: {
        select: {
          Evento: {
            where: {
              borrado: false,
            },
          },
        },
      },
    } satisfies Prisma.CicloProgramaSelect;
  }

  private cicloDetailSelect() {
    return {
      ...this.cicloSelect(),
      Evento: {
        where: {
          borrado: false,
        },
        orderBy: [{ fecha_inicio: 'asc' }, { nombre: 'asc' }],
        select: {
          id: true,
          nombre: true,
          fecha_inicio: true,
          fecha_fin: true,
          terminado: true,
          TipoEvento: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
    } satisfies Prisma.CicloProgramaSelect;
  }

  private buildCicloPdfHtml(
    ciclo: CicloProgramaPdfDetail,
    branding: BrandingData,
  ): string {
    const stageSections = [
      { label: 'Diagnóstico', value: ciclo.diagnostico },
      { label: 'Planificación', value: ciclo.planificacion },
      { label: 'Desarrollo', value: ciclo.desarrollo },
      { label: 'Evaluación', value: ciclo.evaluacion },
    ]
      .map((stage) => {
        const value = sanitizeHtmlForPdf(stage.value ?? '');
        if (!value) {
          return '';
        }

        return `
          <section class="stage-section">
            <h3>${escapeHtml(stage.label)}</h3>
            <div class="rich-content">${value}</div>
          </section>
        `;
      })
      .join('');

    const eventosHtml =
      ciclo.Evento.length > 0
        ? `
          <table class="event-table">
            <thead>
              <tr>
                <th style="width: 34%;">Evento</th>
                <th style="width: 22%;">Fecha</th>
                <th style="width: 24%;">Tipo</th>
                <th style="width: 20%;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${ciclo.Evento.map(
                (evento) => `
                  <tr>
                    <td>
                      <strong>${escapeHtml(evento.nombre)}</strong>
                    </td>
                    <td>
                      ${escapeHtml(this.formatDate(evento.fecha_inicio))}
                      <br />
                      <span class="cell-subtle">${escapeHtml(this.formatDate(evento.fecha_fin))}</span>
                    </td>
                    <td>${escapeHtml(evento.TipoEvento?.nombre ?? 'Sin tipo')}</td>
                    <td>${evento.terminado ? 'Completado' : 'Pendiente'}</td>
                  </tr>
                `,
              ).join('')}
            </tbody>
          </table>
        `
        : '<p>No hay eventos asociados.</p>';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1f2937;
            font-size: 11px;
            line-height: 1.45;
            margin: 0;
          }
          h1, h2, h3, p, table { margin: 0; }
          h1 { font-size: 21px; margin-bottom: 0.35rem; }
          h2 {
            font-size: 13px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #0f172a;
            margin-bottom: 0.7rem;
          }
          h3 { font-size: 13px; margin-bottom: 0.45rem; }
          p { white-space: pre-wrap; }
          .document { display: flex; flex-direction: column; gap: 1.1rem; }
          .header {
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 0.8rem;
          }
          .muted { color: #64748b; }
          .header-description {
            margin-top: 0.55rem;
            color: #334155;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.35rem 1rem;
            margin-top: 0.65rem;
          }
          .meta-item {
            display: flex;
            gap: 0.35rem;
            align-items: baseline;
          }
          .meta-label {
            color: #64748b;
            min-width: 4.8rem;
          }
          .stage-list {
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
          }
          .stage-section {
            padding-bottom: 0.85rem;
            border-bottom: 1px solid #e2e8f0;
            page-break-inside: avoid;
          }
          .stage-section:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .rich-content ul, .rich-content ol {
            margin: 0.2rem 0 0.45rem 1rem;
            padding-left: 0.8rem;
          }
          .rich-content li { margin: 0.18rem 0; }
          .rich-content h1, .rich-content h2, .rich-content h3 {
            margin: 0.45rem 0 0.2rem;
            font-size: 12px;
          }
          .rich-content p { margin: 0 0 0.42rem 0; }
          .event-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .event-table th,
          .event-table td {
            border: 1px solid #cbd5e1;
            padding: 0.42rem 0.5rem;
            vertical-align: top;
            text-align: left;
          }
          .event-table th {
            background: #f8fafc;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #334155;
          }
          .cell-subtle {
            color: #64748b;
            font-size: 10px;
          }
          .empty {
            color: #64748b;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="document">
        <header class="header">
          <h1>${escapeHtml(ciclo.nombre)}</h1>
          <p class="muted">${escapeHtml(branding.nombre_grupo)}</p>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Rama</span>
              <span>${escapeHtml(ciclo.Rama.nombre)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Estado</span>
              <span>${escapeHtml(ciclo.estado)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Inicio</span>
              <span>${escapeHtml(this.formatDate(ciclo.fecha_inicio))}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Fin</span>
              <span>${escapeHtml(this.formatDate(ciclo.fecha_fin))}</span>
            </div>
          </div>
          <p class="header-description">${escapeHtml(
            ciclo.descripcion ?? 'Sin descripción cargada.',
          )}</p>
        </header>
        <section>
          <h2>Bitácora del ciclo</h2>
          <div class="stage-list">${stageSections || '<p class="empty">No hay contenido de bitácora cargado.</p>'}</div>
        </section>
        <section>
          <h2>Eventos vinculados</h2>
          ${eventosHtml}
        </section>
        </div>
      </body>
      </html>
    `;
  }

  private formatDate(date: Date) {
    return formatArgentinaDate(date);
  }

  private extractScopedRamaIds(user: AuthenticatedUser) {
    return Array.from(
      new Set(
        user.scopes
          .filter(
            (scope) =>
              (scope.role === 'JEFATURA_RAMA' ||
                scope.role === 'AYUDANTE_RAMA' ||
                scope.role === 'RESPONSABLE' ||
                scope.role === 'PROTAGONISTA') &&
              scope.scopeType === SCOPE.RAMA &&
              scope.scopeId != null,
          )
          .map((scope) => scope.scopeId as number),
      ),
    );
  }

  private buildCicloScopeWhere(
    user: AuthenticatedUser,
  ): Prisma.CicloProgramaWhereInput | undefined {
    if (hasUnrestrictedAccess(user)) {
      return undefined;
    }

    const ramaIds = this.extractScopedRamaIds(user);

    if (ramaIds.length === 0) {
      return {
        id: -1,
      };
    }

    return {
      id_rama: {
        in: ramaIds,
      },
    };
  }

  private buildRamaScopeWhere(
    user: AuthenticatedUser,
  ): Prisma.RamaWhereInput | undefined {
    if (hasUnrestrictedAccess(user)) {
      return undefined;
    }

    const ramaIds = this.extractScopedRamaIds(user);

    if (ramaIds.length === 0) {
      return {
        id: -1,
      };
    }

    return {
      id: {
        in: ramaIds,
      },
    };
  }

  private mergeCicloWhere(
    baseWhere: Prisma.CicloProgramaWhereInput,
    scopeWhere?: Prisma.CicloProgramaWhereInput,
  ): Prisma.CicloProgramaWhereInput {
    if (!scopeWhere) {
      return baseWhere;
    }

    return {
      AND: [baseWhere, scopeWhere],
    };
  }

  private mergeRamaWhere(
    baseWhere: Prisma.RamaWhereInput,
    scopeWhere?: Prisma.RamaWhereInput,
  ): Prisma.RamaWhereInput {
    if (!scopeWhere) {
      return baseWhere;
    }

    return {
      AND: [baseWhere, scopeWhere],
    };
  }

  private ensureModuleAccess(user: AuthenticatedUser) {
    const hasGroupAccess = user.scopes.some(
      (scope) =>
        (scope.role === 'ADM' ||
          scope.role === 'DEV' ||
          scope.role === 'JEFATURA') &&
        (scope.scopeType === SCOPE.GRUPO || scope.scopeType === SCOPE.GLOBAL),
    );

    const hasBranchAccess = user.scopes.some(
      (scope) =>
        (scope.role === 'JEFATURA_RAMA' || scope.role === 'AYUDANTE_RAMA') &&
        scope.scopeType === SCOPE.RAMA &&
        scope.scopeId != null,
    );

    if (hasGroupAccess || hasBranchAccess) {
      return;
    }

    throw new ForbiddenException(
      'Tu cuenta no tiene permisos para operar ciclos de programa.',
    );
  }
}
