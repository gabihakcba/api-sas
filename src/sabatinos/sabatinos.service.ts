import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasSoftDeleteAuditAccess } from '../auth/utils/unrestricted-access.util';
import { SabatinosQueryDto } from './dto/sabatinos-query.dto';
import { CreateSabatinoDto } from './dto/create-sabatino.dto';
import { UpdateSabatinoDto } from './dto/update-sabatino.dto';
import { UpdateSabatinoActividadesDto } from './dto/update-sabatino-actividades.dto';
import { renderHtmlToPdf, escapeHtml } from '../common/pdf/render-html-to-pdf';

@Injectable()
export class SabatinosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeFilterService: ScopeFilterService,
  ) {}

  async findAll(user: AuthenticatedUser, query: SabatinosQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const includeDeleted =
      query.includeDeleted === true && hasSoftDeleteAuditAccess(user);

    const scopeWhere = this.scopeFilterService.forSabatinos(user);
    const where = this.scopeFilterService.mergeWhere(
      {
        ...(includeDeleted ? {} : { borrado: false }),
        ...(query.q
          ? {
              titulo: {
                contains: query.q.trim(),
                mode: Prisma.QueryMode.insensitive,
              },
            }
          : {}),
        ...(query.fechaDesde || query.fechaHasta
          ? {
              fecha_inicio: {
                ...(query.fechaDesde
                  ? { gte: new Date(query.fechaDesde) }
                  : {}),
                ...(query.fechaHasta
                  ? { lte: new Date(query.fechaHasta) }
                  : {}),
              },
            }
          : {}),
      },
      scopeWhere,
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sabatino.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_inicio: 'desc' },
        include: {
          Educadores: {
            include: {
              Adulto: {
                include: {
                  Miembro: {
                    select: { nombre: true, apellidos: true },
                  },
                },
              },
            },
          },
          RamasAfectadas: {
            include: { Rama: { select: { nombre: true } } },
          },
          AreasAfectadas: {
            include: { Area: { select: { nombre: true } } },
          },
          _count: {
            select: { Actividades: true },
          },
        },
      }),
      this.prisma.sabatino.count({ where }),
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

  async findOne(id: number, user: AuthenticatedUser) {
    const sabatino = await this.prisma.sabatino.findFirst({
      where: this.scopeFilterService.mergeWhere(
        { id, borrado: false },
        this.scopeFilterService.forSabatinos(user),
      ),
      include: {
        Educadores: {
          include: {
            Adulto: {
              include: {
                Miembro: {
                  select: {
                    id: true,
                    nombre: true,
                    apellidos: true,
                    dni: true,
                  },
                },
              },
            },
          },
        },
        Actividades: {
          where: {
            Actividad: {
              borrado: false,
            },
          },
          select: {
            numero: true,
            fecha: true,
            Responsables: {
              select: {
                Adulto: {
                  select: {
                    id: true,
                    Miembro: {
                      select: {
                        id: true,
                        nombre: true,
                        apellidos: true,
                        dni: true,
                      },
                    },
                  },
                },
              },
            },
            Actividad: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                objetivos: true,
                materiales: true,
                id_tipo: true,
                Tipo: {
                  select: {
                    id: true,
                    nombre: true,
                    color: true,
                  },
                },
              },
            },
          },
          orderBy: { numero: 'asc' },
        },
        RamasAfectadas: {
          include: { Rama: { select: { id: true, nombre: true } } },
        },
        AreasAfectadas: {
          include: { Area: { select: { id: true, nombre: true } } },
        },
      },
    });

    if (!sabatino) {
      throw new NotFoundException('Sabatino no encontrado.');
    }

    return sabatino;
  }

  async create(dto: CreateSabatinoDto) {
    return this.prisma.$transaction(async (tx) => {
      const sabatino = await tx.sabatino.create({
        data: {
          titulo: dto.titulo,
          fecha_inicio: new Date(dto.fechaInicio),
          fecha_fin: new Date(dto.fechaFin),
          Educadores: {
            create: dto.educadorIds?.map((id) => ({ id_adulto: id })),
          },
          RamasAfectadas: {
            create: dto.ramaIds?.map((id) => ({ id_rama: id })),
          },
          AreasAfectadas: {
            create: dto.areaIds?.map((id) => ({ id_area: id })),
          },
          Actividades: {
            create: (dto as any).actividadIds?.map((item: any) => ({
              id_actividad: item.actividadId,
              numero: item.numero,
              fecha: item.fecha ? new Date(item.fecha) : undefined,
              Responsables: {
                create: item.responsableIds?.map((rid: number) => ({
                  id_adulto: rid,
                })),
              },
            })),
          },
        },
      });

      return sabatino;
    });
  }

  async update(id: number, dto: UpdateSabatinoDto, user: AuthenticatedUser) {
    const existing = await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      if (dto.educadorIds) {
        await tx.actividadEducadorSabatino.deleteMany({
          where: { id_sabatino: id },
        });
      }
      if (dto.ramaIds) {
        await tx.ramaAfectadaSabatino.deleteMany({
          where: { id_sabatino: id },
        });
      }
      if (dto.areaIds) {
        await tx.areaAfectadaSabatino.deleteMany({
          where: { id_sabatino: id },
        });
      }
      if ((dto as any).actividadIds) {
        await tx.actividadSabatino.deleteMany({
          where: { id_sabatino: id },
        });
      }

      const updated = await tx.sabatino.update({
        where: { id },
        data: {
          titulo: dto.titulo,
          fecha_inicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
          fecha_fin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
          Educadores: dto.educadorIds
            ? {
                create: dto.educadorIds.map((eid: number) => ({
                  id_adulto: eid,
                })),
              }
            : undefined,
          RamasAfectadas: dto.ramaIds
            ? {
                create: dto.ramaIds.map((rid: number) => ({ id_rama: rid })),
              }
            : undefined,
          AreasAfectadas: dto.areaIds
            ? {
                create: dto.areaIds.map((aid: number) => ({ id_area: aid })),
              }
            : undefined,
          Actividades: (dto as any).actividadIds
            ? {
                create: (dto as any).actividadIds.map((item: any) => ({
                  id_actividad: item.actividadId,
                  numero: item.numero,
                  fecha: item.fecha ? new Date(item.fecha) : undefined,
                  Responsables: {
                    create: item.responsableIds?.map((rid: number) => ({
                      id_adulto: rid,
                    })),
                  },
                })),
              }
            : undefined,
        },
      });

      return updated;
    });
  }

  async updateActividades(
    id: number,
    dto: UpdateSabatinoActividadesDto,
    user: AuthenticatedUser,
  ) {
    await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      await tx.actividadSabatino.deleteMany({
        where: { id_sabatino: id },
      });

      if (dto.actividades.length > 0) {
        let index = 0;
        for (const item of dto.actividades) {
          index++;
          await tx.actividadSabatino.create({
            data: {
              id_sabatino: id,
              id_actividad: item.actividadId,
              numero: item.numero ?? index,
              fecha: item.fecha ? new Date(item.fecha) : undefined,
              Responsables: {
                create: (item as any).responsableIds?.map((rid: number) => ({
                  id_adulto: rid,
                })),
              },
            },
          });
        }
      }

      return { success: true };
    });
  }

  async remove(id: number, user: AuthenticatedUser) {
    await this.findOne(id, user);

    await this.prisma.sabatino.update({
      where: { id },
      data: { borrado: true },
    });

    return { success: true };
  }

  async getOptions(user: AuthenticatedUser) {
    const [areas, ramas, adultos] = await Promise.all([
      this.prisma.area.findMany({
        where: { borrado: false },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.rama.findMany({
        where: { borrado: false },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.adulto.findMany({
        where: { borrado: false, activo: true },
        include: {
          Miembro: {
            select: { id: true, nombre: true, apellidos: true, dni: true },
          },
        },
        orderBy: { Miembro: { apellidos: 'asc' } },
      }),
    ]);

    return {
      areas,
      ramas,
      adultos: adultos.map((a) => ({
        id: a.id,
        miembroId: a.Miembro.id,
        nombre: a.Miembro.nombre,
        apellidos: a.Miembro.apellidos,
        dni: a.Miembro.dni,
      })),
    };
  }

  async exportPdf(id: number, user: AuthenticatedUser): Promise<Buffer> {
    const [sabatino, config] = await Promise.all([
      this.findOne(id, user),
      this.prisma.configuracionGrupo.findFirst({ where: { id: 1 } }),
    ]);

    const groupName = config?.nombre_grupo?.trim() || 'Grupo Scout';

    const educadores = sabatino.Educadores.map(
      (e) => `${e.Adulto.Miembro.apellidos}, ${e.Adulto.Miembro.nombre}`,
    ).join(', ');

    const ramas = sabatino.RamasAfectadas.map((r) => r.Rama.nombre).join(', ');

    const activitiesWithDetail: any[] = [];
    const TEXT_THRESHOLD = 150;

    const tableRowsHtml = (sabatino.Actividades || [])
      .map((row) => {
        const act = row.Actividad;
        const needsDetail =
          (act.descripcion?.length || 0) > TEXT_THRESHOLD ||
          (act.objetivos?.length || 0) > TEXT_THRESHOLD ||
          (act.materiales?.length || 0) > TEXT_THRESHOLD;

        if (needsDetail) {
          activitiesWithDetail.push({ ...row, Actividad: act });
        }

        const responsables = row.Responsables.map(
          (r: any) => r.Adulto.Miembro.nombre,
        ).join(', ');

        return `
        <tr>
          <td style="text-align: center;">${new Intl.DateTimeFormat('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Argentina/Buenos_Aires',
          }).format(new Date(row.fecha))}</td>
          <td style="text-align: center;">${row.numero || '-'}</td>
          <td><strong>${escapeHtml(act.nombre)}</strong></td>
          <td style="font-size: 9px;">${
            needsDetail
              ? `<div style="text-align: center; font-weight: bold; font-size: 14px; color: #666;">Ver Detalle ${row.numero}</div>`
              : escapeHtml(act.descripcion || '-')
          }</td>
          <td style="font-size: 9px;">${
            needsDetail
              ? `<div style="text-align: center; font-weight: bold; font-size: 14px; color: #666;">Ver Detalle ${row.numero}</div>`
              : escapeHtml(act.objetivos || '-')
          }</td>
          <td style="font-size: 9px;">${
            needsDetail
              ? `<div style="text-align: center; font-weight: bold; font-size: 14px; color: #666;">Ver Detalle ${row.numero}</div>`
              : escapeHtml(act.materiales || '-')
          }</td>
          <td style="font-size: 9px;">${escapeHtml(responsables || '-')}</td>
          <td style="text-align: center; font-size: 9px;">
            ${escapeHtml(act.Tipo.nombre)}
          </td>
        </tr>
      `;
      })
      .join('');

    const detailsHtml = activitiesWithDetail
      .map((row) => {
        const act = row.Actividad;
        const responsables = row.Responsables.map(
          (r: any) => r.Adulto.Miembro.nombre,
        ).join(', ');

        return `
        <div class="detail-block">
          <div class="detail-header">
            <span class="detail-number">${row.numero}</span>
            <span class="detail-title">${escapeHtml(act.nombre)}</span>
            <span class="detail-meta">
              ${new Intl.DateTimeFormat('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'America/Argentina/Buenos_Aires',
              }).format(new Date(row.fecha))} | 
              ${escapeHtml(act.Tipo.nombre)} | 
              Resp: ${escapeHtml(responsables)}
            </span>
          </div>
          <div class="detail-content">
            ${
              act.descripcion
                ? `<div class="detail-section">
                <strong>Descripción:</strong>
                <p>${escapeHtml(act.descripcion)}</p>
              </div>`
                : ''
            }
            ${
              act.objetivos
                ? `<div class="detail-section">
                <strong>Objetivos:</strong>
                <p>${escapeHtml(act.objetivos)}</p>
              </div>`
                : ''
            }
            ${
              act.materiales
                ? `<div class="detail-section">
                <strong>Materiales:</strong>
                <p>${escapeHtml(act.materiales)}</p>
              </div>`
                : ''
            }
          </div>
        </div>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #111; font-size: 10px; line-height: 1.3; margin: 0; padding: 0; }
          .container { padding: 10mm; }
          header { margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 8px; }
          h1 { font-size: 18px; margin: 0 0 8px 0; }
          .info-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 10px; }
          .info-item { min-width: 200px; }
          .info-label { font-weight: bold; color: #000; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: fixed; }
          th, td { border: 0.5pt solid #000; padding: 4px 3px; text-align: left; vertical-align: top; overflow: hidden; }
          th { background-color: #eee; font-weight: bold; text-transform: uppercase; font-size: 9px; }
          
          .detail-block { margin-top: 20px; border: 0.5pt solid #000; page-break-inside: avoid; }
          .detail-header { background-color: #eee; color: #000; padding: 6px 10px; display: flex; align-items: center; border-bottom: 0.5pt solid #000; }
          .detail-number { font-size: 14px; font-weight: bold; border: 1pt solid #000; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-right: 10px; background: #fff; }
          .detail-title { font-size: 12px; font-weight: bold; flex-grow: 1; }
          .detail-meta { font-size: 9px; }
          .detail-content { padding: 8px 10px; }
          .detail-section { margin-bottom: 8px; }
          .detail-section strong { display: block; text-decoration: underline; margin-bottom: 2px; }
          p { margin: 0; white-space: pre-wrap; font-size: 10px; }

          @page { size: A4 landscape; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>Planificación Sabatino: ${escapeHtml(sabatino.titulo)}</h1>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Lugar:</span> <span>${escapeHtml(groupName)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha:</span> <span>${new Intl.DateTimeFormat(
                  'es-AR',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'America/Argentina/Buenos_Aires',
                  },
                ).format(
                  new Date(sabatino.fecha_inicio),
                )} - ${new Intl.DateTimeFormat('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'America/Argentina/Buenos_Aires',
                }).format(new Date(sabatino.fecha_fin))}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Ramas:</span> <span>${escapeHtml(
                  ramas || 'Todas',
                )}</span>
              </div>
              <div class="info-item" style="width: 100%;">
                <span class="info-label">Educadores:</span> <span>${escapeHtml(
                  educadores,
                )}</span>
              </div>
            </div>
          </header>

          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">Hora</th>
                <th style="width: 25px; text-align: center;">N°</th>
                <th style="width: 100px;">Actividad</th>
                <th style="width: 150px;">Descripción</th>
                <th style="width: 150px;">Objetivos</th>
                <th style="width: 150px;">Materiales</th>
                <th style="width: 80px;">Resp.</th>
                <th style="width: 60px; text-align: center;">Tipo</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          ${
            activitiesWithDetail.length > 0
              ? `
          <div style="page-break-before: always;"></div>
          <h2 style="font-size: 16px; border-bottom: 1pt solid #000; margin-top: 20px; padding-bottom: 5px;">Detalle de Actividades Planificadas</h2>
          ${detailsHtml}
          `
              : ''
          }
        </div>
      </body>
      </html>
    `;

    return renderHtmlToPdf(html);
  }
}
