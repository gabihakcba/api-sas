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
        ? `<ul>${ciclo.Evento.map(
            (evento) => `<li>
          <strong>${escapeHtml(evento.nombre)}</strong><br/>
          <span>${escapeHtml(this.formatDate(evento.fecha_inicio))} – ${escapeHtml(this.formatDate(evento.fecha_fin))}</span><br/>
          <span>Tipo: ${escapeHtml(evento.TipoEvento?.nombre ?? 'Sin tipo')} · Estado: ${evento.terminado ? 'Completado' : 'Pendiente'}</span>
        </li>`,
          ).join('')}</ul>`
        : '<p>No hay eventos asociados.</p>';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; font-size: 12px; line-height: 1.5; }
          h1 { font-size: 22px; margin: 0 0 4px 0; }
          h2 { font-size: 16px; margin: 20px 0 8px 0; }
          h3 { font-size: 14px; margin: 0 0 8px 0; }
          p { margin: 0 0 8px 0; white-space: pre-wrap; }
          .muted { color: #6b7280; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
          .stage-section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
          .rich-content { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; }
          .rich-content ul, .rich-content ol { margin: 0 0 8px 20px; padding-left: 20px; }
          .rich-content li { margin: 3px 0; }
          .rich-content h1, .rich-content h2, .rich-content h3 { margin: 8px 0 4px; }
          .rich-content p { margin: 0 0 8px 0; }
          ul { margin: 0; padding-left: 20px; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <header class="card">
          <h1>${escapeHtml(ciclo.nombre)}</h1>
          <p class="muted">${escapeHtml(branding.nombre_grupo)}</p>
          <p>
            <strong>Rama:</strong> ${escapeHtml(ciclo.Rama.nombre)} ·
            <strong>Estado:</strong> ${escapeHtml(ciclo.estado)}
          </p>
          <p>
            <strong>Período:</strong> ${escapeHtml(this.formatDate(ciclo.fecha_inicio))} – ${escapeHtml(this.formatDate(ciclo.fecha_fin))}
          </p>
          <p>${escapeHtml(ciclo.descripcion ?? 'Sin descripción cargada.')}</p>
        </header>
        <section>
          <h2>Bitácora del ciclo</h2>
          ${stageSections || '<p>No hay contenido de bitácora cargado.</p>'}
        </section>
        <section class="card">
          <h2>Eventos vinculados</h2>
          ${eventosHtml}
        </section>
      </body>
      </html>
    `;
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
      date,
    );
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
