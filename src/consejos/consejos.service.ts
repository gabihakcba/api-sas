import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ESTADO_TEMARIO, Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasSoftDeleteAuditAccess } from '../auth/utils/unrestricted-access.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsejoDto } from './dto/create-consejo.dto';
import { UpdateConsejoDto } from './dto/update-consejo.dto';
import { CreateTemarioConsejoDto } from './dto/create-temario-consejo.dto';
import { UpdateTemarioConsejoDto } from './dto/update-temario-consejo.dto';
import { ConsejoAsistenciaOptionsQueryDto } from './dto/consejo-asistencia-options-query.dto';
import { CreateAsistenciaConsejoDto } from './dto/create-asistencia-consejo.dto';
import { UpdateConsejoModeradorDto } from './dto/update-consejo-moderador.dto';
import { UpdateConsejoSecretariaDto } from './dto/update-consejo-secretaria.dto';
import {
  escapeHtml,
  renderHtmlToPdf,
  sanitizeHtmlForPdf,
} from '../common/pdf/render-html-to-pdf';

type AttendanceMember = {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  Adulto: { id: number } | null;
  Protagonista: {
    id: number;
    Miembro: {
      MiembroRama: Array<{
        Rama: {
          id: number;
          nombre: string;
        };
      }>;
    };
  } | null;
  Responsable: { id: number } | null;
};

type ConsejoExportData = {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha: Date;
  es_ordinario: boolean;
  hora_inicio: Date | null;
  hora_fin: Date | null;
  Moderador: {
    id: number;
    nombre: string;
    apellidos: string;
    dni: string;
  } | null;
  Secretario: {
    id: number;
    nombre: string;
    apellidos: string;
    dni: string;
  } | null;
  Prosecretario: {
    id: number;
    nombre: string;
    apellidos: string;
    dni: string;
  } | null;
  AsistenciaConsejo: Array<{
    id: number;
    descripcion: string;
    Miembro: AttendanceMember;
  }>;
  TemarioConsejo: Array<{
    id: number;
    titulo: string;
    descripcion: string | null;
    debate: string | null;
    acuerdo: string | null;
    sin_mp: boolean;
    estado: ESTADO_TEMARIO;
  }>;
};

@Injectable()
export class ConsejosService {
  private static readonly CONSEJO_ALLOWED_PROTAGONISTA_RAMAS = [
    'Caminantes',
    'Rovers',
  ] as const;

  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser, paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;
    const includeDeleted =
      paginationQuery.includeDeleted === true && hasSoftDeleteAuditAccess(user);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.consejo.findMany({
        where: {
          ...(includeDeleted ? {} : { borrado: false }),
        },
        skip,
        take: limit,
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        select: this.buildConsejoSelect(user),
      }),
      this.prisma.consejo.count({
        where: {
          ...(includeDeleted ? {} : { borrado: false }),
        },
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

  async findOne(id: number, user: AuthenticatedUser) {
    const consejo = await this.prisma.consejo.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: this.buildConsejoSelect(user),
    });

    if (!consejo) {
      throw new NotFoundException('El consejo indicado no existe.');
    }

    return consejo;
  }

  async create(dto: CreateConsejoDto) {
    const data = this.normalizeCreatePayload(dto);
    await this.ensureUniqueNombre(data.nombre);

    return this.prisma.consejo.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        fecha: data.fecha,
        es_ordinario: data.esOrdinario,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
      },
      select: this.buildConsejoSelect(),
    });
  }

  async exportPdf(
    idConsejo: number,
    user: AuthenticatedUser,
    includePrivateTopics: boolean,
  ) {
    if (includePrivateTopics && this.shouldHidePrivateTemario(user)) {
      throw new ForbiddenException(
        'El usuario no tiene acceso al PDF completo del consejo.',
      );
    }

    const allowPrivateTopics =
      includePrivateTopics && !this.shouldHidePrivateTemario(user);
    const consejo = await this.getConsejoExportData(
      idConsejo,
      allowPrivateTopics,
    );
    const html = this.buildConsejoPdfHtml(consejo, allowPrivateTopics);
    const buffer = await renderHtmlToPdf(html);
    const slug = consejo.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return {
      filename: `${slug || 'consejo'}${allowPrivateTopics ? '' : '-pdf'}.pdf`,
      buffer,
    };
  }

  async findAsistencias(idConsejo: number) {
    await this.ensureExists(idConsejo);

    return this.prisma.asistenciaConsejo.findMany({
      where: {
        id_consejo: idConsejo,
        borrado: false,
        Miembro: this.buildConsejoAttendanceEligibleWhere(),
      },
      orderBy: [
        { Miembro: { apellidos: 'asc' } },
        { Miembro: { nombre: 'asc' } },
      ],
      select: {
        id: true,
        descripcion: true,
        Miembro: {
          select: this.memberAttendanceSelect(),
        },
      },
    });
  }

  async getAsistenciaOptions(
    idConsejo: number,
    query: ConsejoAsistenciaOptionsQueryDto,
  ) {
    await this.ensureExists(idConsejo);

    const search = query.q?.trim();
    const miembros = await this.prisma.miembro.findMany({
      where: {
        ...this.buildConsejoAttendanceEligibleWhere(),
        AND: [
          ...(search
            ? [
                {
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
                },
              ]
            : []),
        ],
      },
      select: this.memberAttendanceSelect(),
    });

    return miembros
      .map((miembro) => ({
        ...miembro,
        displayLabel: `${miembro.apellidos}, ${miembro.nombre} (${miembro.dni})`,
        categoryLabel: this.resolveAttendanceCategory(miembro),
        sortOrder: this.resolveAttendanceSortOrder(miembro),
      }))
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return `${left.apellidos} ${left.nombre}`.localeCompare(
          `${right.apellidos} ${right.nombre}`,
          'es',
        );
      });
  }

  async findTemario(id: number, user: AuthenticatedUser) {
    await this.ensureExists(id);

    const shouldHidePrivateTemario = this.shouldHidePrivateTemario(user);

    return this.prisma.temarioConsejo.findMany({
      where: {
        id_consejo: id,
        borrado: false,
        ...(shouldHidePrivateTemario ? { sin_mp: false } : {}),
      },
      orderBy: {
        id: 'asc',
      },
      select: this.temarioSelect(),
    });
  }

  async createTemario(
    idConsejo: number,
    dto: CreateTemarioConsejoDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureExists(idConsejo);
    await this.ensureAdultMember(user.memberId);
    const data = this.normalizeTemarioCreatePayload(dto);

    return this.prisma.temarioConsejo.create({
      data: {
        id_consejo: idConsejo,
        titulo: data.titulo,
        descripcion: data.descripcion,
        debate: data.debate,
        acuerdo: data.acuerdo,
        sin_mp: data.sinMp,
        estado: data.estado,
      },
      select: this.temarioSelect(),
    });
  }

  async createAsistencia(idConsejo: number, dto: CreateAsistenciaConsejoDto) {
    await this.ensureExists(idConsejo);

    const miembro = await this.prisma.miembro.findFirst({
      where: {
        id: dto.idMiembro,
        ...this.buildConsejoAttendanceEligibleWhere(),
      },
      select: this.memberAttendanceSelect(),
    });

    if (!miembro) {
      throw new NotFoundException(
        'El miembro indicado no existe o no es elegible para asistencia de consejo.',
      );
    }

    const alreadyExists = await this.prisma.asistenciaConsejo.findFirst({
      where: {
        id_consejo: idConsejo,
        id_miembro: dto.idMiembro,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (alreadyExists) {
      throw new ConflictException(
        'Ese miembro ya figura como asistente del consejo.',
      );
    }

    return this.prisma.asistenciaConsejo.create({
      data: {
        id_consejo: idConsejo,
        id_miembro: dto.idMiembro,
        descripcion: this.resolveAttendanceDescription(miembro),
      },
      select: {
        id: true,
        descripcion: true,
        Miembro: {
          select: this.memberAttendanceSelect(),
        },
      },
    });
  }

  async update(id: number, dto: UpdateConsejoDto) {
    await this.ensureExists(id);
    const data = this.normalizeUpdatePayload(dto);

    if (data.nombre !== undefined) {
      await this.ensureUniqueNombre(data.nombre, id);
    }

    return this.prisma.consejo.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.descripcion !== undefined
          ? { descripcion: data.descripcion }
          : {}),
        ...(data.fecha !== undefined ? { fecha: data.fecha } : {}),
        ...(data.esOrdinario !== undefined
          ? { es_ordinario: data.esOrdinario }
          : {}),
        ...(data.horaInicio !== undefined
          ? { hora_inicio: data.horaInicio }
          : {}),
        ...(data.horaFin !== undefined ? { hora_fin: data.horaFin } : {}),
      },
      select: this.buildConsejoSelect(),
    });
  }

  async updateModerador(id: number, dto: UpdateConsejoModeradorDto) {
    await this.ensureExists(id);

    if (dto.idModerador !== null) {
      const miembro = await this.prisma.miembro.findFirst({
        where: {
          id: dto.idModerador,
          borrado: false,
        },
        select: {
          id: true,
        },
      });

      if (!miembro) {
        throw new NotFoundException('El moderador indicado no existe.');
      }
    }

    return this.prisma.consejo.update({
      where: { id },
      data: {
        Moderador:
          dto.idModerador === null
            ? {
                disconnect: true,
              }
            : {
                connect: {
                  id: dto.idModerador,
                },
              },
      },
      select: this.buildConsejoSelect(),
    });
  }

  async updateSecretaria(
    id: number,
    dto: UpdateConsejoSecretariaDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureExists(id);
    await this.ensureAdultMember(user.memberId);

    if (dto.idSecretario !== null) {
      await this.ensureAdultMember(dto.idSecretario);
    }

    if (dto.idProsecretario !== null) {
      await this.ensureAdultMember(dto.idProsecretario);
    }

    return this.prisma.consejo.update({
      where: { id },
      data: {
        Secretario:
          dto.idSecretario === null
            ? { disconnect: true }
            : { connect: { id: dto.idSecretario } },
        Prosecretario:
          dto.idProsecretario === null
            ? { disconnect: true }
            : { connect: { id: dto.idProsecretario } },
      },
      select: this.buildConsejoSelect(),
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prisma.consejo.update({
      where: { id },
      data: {
        borrado: true,
      },
    });
  }

  async updateTemario(
    idConsejo: number,
    temarioId: number,
    dto: UpdateTemarioConsejoDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureExists(idConsejo);
    await this.ensureTemarioExists(idConsejo, temarioId);
    await this.ensureAdultMember(user.memberId);
    await this.ensureTemarioRestrictedFieldsAccess(
      idConsejo,
      user.memberId,
      dto,
    );
    const data = this.normalizeTemarioUpdatePayload(dto);

    return this.prisma.temarioConsejo.update({
      where: {
        id: temarioId,
      },
      data: {
        ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
        ...(data.descripcion !== undefined
          ? { descripcion: data.descripcion }
          : {}),
        ...(data.debate !== undefined ? { debate: data.debate } : {}),
        ...(data.acuerdo !== undefined ? { acuerdo: data.acuerdo } : {}),
        ...(data.sinMp !== undefined ? { sin_mp: data.sinMp } : {}),
        ...(data.estado !== undefined ? { estado: data.estado } : {}),
      },
      select: this.temarioSelect(),
    });
  }

  async removeTemario(
    idConsejo: number,
    temarioId: number,
    user: AuthenticatedUser,
  ) {
    await this.ensureExists(idConsejo);
    await this.ensureTemarioExists(idConsejo, temarioId);
    await this.ensureAdultMember(user.memberId);

    await this.prisma.temarioConsejo.update({
      where: {
        id: temarioId,
      },
      data: {
        borrado: true,
      },
    });
  }

  private buildConsejoSelect(user?: AuthenticatedUser) {
    const shouldHidePrivateTemario = this.shouldHidePrivateTemario(user);

    return {
      id: true,
      borrado: true,
      nombre: true,
      descripcion: true,
      fecha: true,
      es_ordinario: true,
      hora_inicio: true,
      hora_fin: true,
      Moderador: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
        },
      },
      Secretario: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
        },
      },
      Prosecretario: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
        },
      },
      TemarioConsejo: {
        where: {
          borrado: false,
          ...(shouldHidePrivateTemario ? { sin_mp: false } : {}),
        },
        orderBy: {
          id: Prisma.SortOrder.asc,
        },
        select: {
          ...this.temarioSelect(),
        },
      },
      _count: {
        select: {
          AsistenciaConsejo: {
            where: {
              borrado: false,
            },
          },
          TemarioConsejo: {
            where: {
              borrado: false,
              ...(shouldHidePrivateTemario ? { sin_mp: false } : {}),
            },
          },
        },
      },
    };
  }

  private temarioSelect() {
    return {
      id: true,
      titulo: true,
      descripcion: true,
      debate: true,
      acuerdo: true,
      sin_mp: true,
      estado: true,
    } satisfies Prisma.TemarioConsejoSelect;
  }

  private memberAttendanceSelect() {
    return {
      id: true,
      nombre: true,
      apellidos: true,
      dni: true,
      Adulto: {
        select: {
          id: true,
        },
      },
      Protagonista: {
        select: {
          id: true,
          Miembro: {
            select: {
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
                take: 1,
              },
            },
          },
        },
      },
      Responsable: {
        select: {
          id: true,
        },
      },
    } satisfies Prisma.MiembroSelect;
  }

  private buildConsejoAttendanceEligibleWhere(): Prisma.MiembroWhereInput {
    return {
      borrado: false,
      OR: [
        {
          Adulto: {
            is: {
              borrado: false,
              activo: true,
            },
          },
        },
        {
          Responsable: {
            is: {
              borrado: false,
            },
          },
        },
        {
          Protagonista: {
            is: {
              borrado: false,
              activo: true,
              Miembro: {
                MiembroRama: {
                  some: {
                    borrado: false,
                    fecha_egreso: null,
                    Rama: {
                      nombre: {
                        in: [
                          ...ConsejosService.CONSEJO_ALLOWED_PROTAGONISTA_RAMAS,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    };
  }

  private async ensureAdultMember(memberId: number | null) {
    if (!memberId) {
      throw new BadRequestException('El miembro indicado no es válido.');
    }

    const member = await this.prisma.miembro.findFirst({
      where: {
        id: memberId,
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
      },
    });

    if (!member) {
      throw new BadRequestException('El miembro debe ser un adulto activo.');
    }
  }

  private async ensureSecretariaEditor(
    idConsejo: number,
    memberId: number | null,
  ) {
    if (!memberId) {
      throw new BadRequestException('Tu cuenta no tiene un miembro vinculado.');
    }

    const consejo = await this.prisma.consejo.findFirst({
      where: {
        id: idConsejo,
        borrado: false,
      },
      select: {
        id_secretario: true,
        id_prosecretario: true,
      },
    });

    if (!consejo) {
      throw new NotFoundException('El consejo indicado no existe.');
    }

    if (
      consejo.id_secretario !== memberId &&
      consejo.id_prosecretario !== memberId
    ) {
      throw new BadRequestException(
        'Solo el secretario o prosecretario pueden editar el temario.',
      );
    }
  }

  private async ensureTemarioRestrictedFieldsAccess(
    idConsejo: number,
    memberId: number | null,
    dto: UpdateTemarioConsejoDto,
  ) {
    const wantsRestrictedUpdate =
      dto.debate !== undefined ||
      dto.acuerdo !== undefined ||
      dto.estado !== undefined;

    if (!wantsRestrictedUpdate) {
      return;
    }

    await this.ensureSecretariaEditor(idConsejo, memberId);
  }

  private normalizeCreatePayload(dto: CreateConsejoDto) {
    const nombre = dto.nombre.trim().replace(/\s+/g, ' ');
    const descripcion = dto.descripcion?.trim() || null;
    const fecha = new Date(dto.fecha);
    const horaInicio = dto.horaInicio ? new Date(dto.horaInicio) : null;
    const horaFin = dto.horaFin ? new Date(dto.horaFin) : null;

    this.validateNormalizedPayload(nombre, horaInicio, horaFin);

    return {
      nombre,
      descripcion,
      fecha,
      esOrdinario: dto.esOrdinario,
      horaInicio,
      horaFin,
    };
  }

  private normalizeUpdatePayload(dto: UpdateConsejoDto): {
    nombre?: string;
    descripcion?: string | null;
    fecha?: Date;
    esOrdinario?: boolean;
    horaInicio?: Date | null;
    horaFin?: Date | null;
  } {
    const nombre =
      dto.nombre !== undefined
        ? dto.nombre.trim().replace(/\s+/g, ' ')
        : undefined;
    const descripcion =
      dto.descripcion !== undefined
        ? dto.descripcion.trim() || null
        : undefined;
    const fecha = dto.fecha !== undefined ? new Date(dto.fecha) : undefined;
    const horaInicio =
      dto.horaInicio !== undefined ? new Date(dto.horaInicio) : undefined;
    const horaFin =
      dto.horaFin !== undefined ? new Date(dto.horaFin) : undefined;

    this.validateNormalizedPayload(nombre, horaInicio, horaFin);

    return {
      ...(nombre !== undefined ? { nombre } : {}),
      ...(descripcion !== undefined ? { descripcion } : {}),
      ...(fecha !== undefined ? { fecha } : {}),
      ...(dto.esOrdinario !== undefined
        ? { esOrdinario: dto.esOrdinario }
        : {}),
      ...(horaInicio !== undefined ? { horaInicio } : {}),
      ...(horaFin !== undefined ? { horaFin } : {}),
    };
  }

  private validateNormalizedPayload(
    nombre?: string,
    horaInicio?: Date | null,
    horaFin?: Date | null,
  ) {
    if (nombre !== undefined && nombre.length < 3) {
      throw new BadRequestException(
        'El nombre del consejo debe tener al menos 3 caracteres.',
      );
    }

    if (horaInicio && horaFin && horaInicio > horaFin) {
      throw new BadRequestException(
        'La hora de inicio no puede ser posterior a la hora de fin.',
      );
    }
  }

  private normalizeTemarioCreatePayload(dto: CreateTemarioConsejoDto) {
    const titulo = dto.titulo.trim().replace(/\s+/g, ' ');
    const descripcion = dto.descripcion?.trim() || null;
    const debate = dto.debate ? this.sanitizeRichTextHtml(dto.debate) : null;
    const acuerdo = dto.acuerdo ? this.sanitizeRichTextHtml(dto.acuerdo) : null;

    if (titulo.length < 3) {
      throw new BadRequestException(
        'El titulo del tema debe tener al menos 3 caracteres.',
      );
    }

    return {
      titulo,
      descripcion,
      debate,
      acuerdo,
      sinMp: dto.sinMp ?? false,
      estado: dto.estado ?? 'PENDIENTE',
    };
  }

  private normalizeTemarioUpdatePayload(dto: UpdateTemarioConsejoDto): {
    titulo?: string;
    descripcion?: string | null;
    debate?: string | null;
    acuerdo?: string | null;
    sinMp?: boolean;
    estado?: ESTADO_TEMARIO;
  } {
    const titulo =
      dto.titulo !== undefined
        ? dto.titulo.trim().replace(/\s+/g, ' ')
        : undefined;
    const descripcion =
      dto.descripcion !== undefined
        ? dto.descripcion.trim() || null
        : undefined;
    const debate =
      dto.debate !== undefined
        ? dto.debate
          ? this.sanitizeRichTextHtml(dto.debate)
          : null
        : undefined;
    const acuerdo =
      dto.acuerdo !== undefined
        ? dto.acuerdo
          ? this.sanitizeRichTextHtml(dto.acuerdo)
          : null
        : undefined;

    if (titulo !== undefined && titulo.length < 3) {
      throw new BadRequestException(
        'El titulo del tema debe tener al menos 3 caracteres.',
      );
    }

    return {
      ...(titulo !== undefined ? { titulo } : {}),
      ...(descripcion !== undefined ? { descripcion } : {}),
      ...(debate !== undefined ? { debate } : {}),
      ...(acuerdo !== undefined ? { acuerdo } : {}),
      ...(dto.sinMp !== undefined ? { sinMp: dto.sinMp } : {}),
      ...(dto.estado !== undefined ? { estado: dto.estado } : {}),
    };
  }

  private shouldHidePrivateTemario(user?: AuthenticatedUser): boolean {
    if (!user) {
      return false;
    }

    return (
      user.roles.includes('PROTAGONISTA') || user.roles.includes('RESPONSABLE')
    );
  }

  private async ensureExists(id: number) {
    const consejo = await this.prisma.consejo.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!consejo) {
      throw new NotFoundException('El consejo indicado no existe.');
    }
  }

  private async ensureUniqueNombre(nombre: string, excludeId?: number) {
    const consejo = await this.prisma.consejo.findFirst({
      where: {
        nombre,
        borrado: false,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (consejo) {
      throw new ConflictException(
        'Ya existe un consejo activo con ese nombre.',
      );
    }
  }

  private async getConsejoExportData(
    idConsejo: number,
    includePrivateTopics: boolean,
  ): Promise<ConsejoExportData> {
    const consejo = await this.prisma.consejo.findFirst({
      where: {
        id: idConsejo,
        borrado: false,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        fecha: true,
        es_ordinario: true,
        hora_inicio: true,
        hora_fin: true,
        Moderador: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            dni: true,
          },
        },
        Secretario: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            dni: true,
          },
        },
        Prosecretario: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            dni: true,
          },
        },
        AsistenciaConsejo: {
          where: {
            borrado: false,
          },
          select: {
            id: true,
            descripcion: true,
            Miembro: {
              select: this.memberAttendanceSelect(),
            },
          },
        },
        TemarioConsejo: {
          where: {
            borrado: false,
            ...(includePrivateTopics ? {} : { sin_mp: false }),
          },
          orderBy: {
            id: Prisma.SortOrder.asc,
          },
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            debate: true,
            acuerdo: true,
            sin_mp: true,
            estado: true,
          },
        },
      },
    });

    if (!consejo) {
      throw new NotFoundException('El consejo indicado no existe.');
    }

    return {
      ...consejo,
      AsistenciaConsejo: [...consejo.AsistenciaConsejo].sort((left, right) => {
        const leftOrder = this.resolveAttendanceSortOrder(left.Miembro);
        const rightOrder = this.resolveAttendanceSortOrder(right.Miembro);

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return `${left.Miembro.apellidos} ${left.Miembro.nombre}`.localeCompare(
          `${right.Miembro.apellidos} ${right.Miembro.nombre}`,
          'es',
        );
      }),
    };
  }

  private buildConsejoPdfHtml(
    consejo: ConsejoExportData,
    includePrivateTopics: boolean,
  ): string {
    const asistentesHtml =
      consejo.AsistenciaConsejo.length > 0
        ? `<ol>${consejo.AsistenciaConsejo.map((asistencia) => {
            const miembro = asistencia.Miembro;
            const descripcion = asistencia.descripcion?.trim();
            const descriptionSuffix = descripcion
              ? ` (${escapeHtml(descripcion)})`
              : '';

            return `<li><strong>${escapeHtml(
              `${miembro.apellidos}, ${miembro.nombre}`,
            )}</strong>${descriptionSuffix}</li>`;
          }).join('')}</ol>`
        : '<p>No se registraron asistencias.</p>';

    const temasHtml =
      consejo.TemarioConsejo.length > 0
        ? consejo.TemarioConsejo.map((tema) => {
            const descripcion = tema.descripcion?.trim();
            const debate = sanitizeHtmlForPdf(tema.debate ?? '');
            const acuerdo = sanitizeHtmlForPdf(tema.acuerdo ?? '');

            return `
              <section class="tema">
                <div class="tema-head">
                  <div>
                    <h3>${escapeHtml(tema.titulo)}</h3>
                    ${
                      descripcion
                        ? `<p class="tema-description">${escapeHtml(descripcion)}</p>`
                        : ''
                    }
                  </div>
                  <div class="tema-badges">
                    <span class="badge">${escapeHtml(this.formatEstado(tema.estado))}</span>
                  </div>
                </div>
                <div class="tema-sections">
                  <div class="tema-section">
                    <h4>Debate</h4>
                    <div class="rich-content">${debate || '<p>Sin contenido.</p>'}</div>
                  </div>
                  <div class="tema-section">
                    <h4>Acuerdo</h4>
                    <div class="rich-content">${acuerdo || '<p>Sin contenido.</p>'}</div>
                  </div>
                </div>
              </section>
            `;
          }).join('')
        : '<p>No hay temas cargados para exportar.</p>';

    const moderador = consejo.Moderador
      ? `${consejo.Moderador.apellidos}, ${consejo.Moderador.nombre}`
      : 'Sin asignar';
    const secretario = consejo.Secretario
      ? `${consejo.Secretario.apellidos}, ${consejo.Secretario.nombre}`
      : 'Sin asignar';
    const prosecretario = consejo.Prosecretario
      ? `${consejo.Prosecretario.apellidos}, ${consejo.Prosecretario.nombre}`
      : 'Sin asignar';

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
          h1, h2, h3, h4, p, ol, ul { margin: 0; }
          h1 { font-size: 21px; line-height: 1.15; margin-bottom: 0.35rem; }
          h2 {
            font-size: 13px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #0f172a;
            margin-bottom: 0.6rem;
            page-break-after: avoid;
          }
          h3 { font-size: 13px; line-height: 1.25; }
          h4 {
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #475569;
            margin-bottom: 0.35rem;
          }
          p { white-space: pre-wrap; }
          section { page-break-inside: auto; }
          .document { display: flex; flex-direction: column; gap: 1.1rem; }
          .header {
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 0.8rem;
          }
          .header-summary {
            color: #475569;
            margin-bottom: 0.55rem;
          }
          .header-description {
            margin-bottom: 0.65rem;
            color: #334155;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.35rem 1rem;
          }
          .meta-item {
            display: flex;
            gap: 0.35rem;
            align-items: baseline;
          }
          .meta-label {
            color: #64748b;
            min-width: 6rem;
          }
          .compact-list {
            margin: 0;
            padding-left: 1.1rem;
            columns: 2;
            column-gap: 1.25rem;
          }
          .compact-list li {
            margin-bottom: 0.3rem;
            break-inside: avoid;
          }
          .section-block {
            padding-top: 0.15rem;
          }
          .section-block-title {
            margin-bottom: 0.6rem;
          }
          .temas {
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
          }
          .temas > .tema:first-child {
            page-break-before: avoid;
          }
          .tema {
            padding-bottom: 0.9rem;
            border-bottom: 1px solid #e2e8f0;
          }
          .tema:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .tema-head {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            align-items: flex-start;
            margin-bottom: 0.55rem;
          }
          .tema-description {
            margin-top: 0.3rem;
            color: #475569;
          }
          .tema-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.3rem;
            justify-content: flex-end;
          }
          .badge {
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            padding: 0.14rem 0.45rem;
            font-size: 10px;
            color: #0f172a;
            white-space: nowrap;
          }
          .badge-subtle {
            color: #475569;
          }
          .tema-sections {
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
          }
          .tema-section + .tema-section {
            padding-top: 0.45rem;
            border-top: 1px dashed #e2e8f0;
          }
          .rich-content {
            color: #1f2937;
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
          .empty {
            color: #64748b;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="document">
        <header class="header">
          <h1>${escapeHtml(consejo.nombre)}</h1>
          <p class="header-summary">
            Fecha: ${escapeHtml(this.formatDate(consejo.fecha))}
            · Tipo: ${consejo.es_ordinario ? 'Ordinario' : 'Extraordinario'}
          </p>
          <p class="header-description">${escapeHtml(
            consejo.descripcion ?? 'Sin descripcion cargada.',
          )}</p>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Horario</span>
              <span>${escapeHtml(
                this.formatTimeRange(consejo.hora_inicio, consejo.hora_fin),
              )}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Moderador</span>
              <span>${escapeHtml(moderador)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Secretario</span>
              <span>${escapeHtml(secretario)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Prosecretario</span>
              <span>${escapeHtml(prosecretario)}</span>
            </div>
          </div>
        </header>
        <section class="section-block">
          <h2 class="section-block-title">Asistencias</h2>
          ${asistentesHtml}
        </section>
        <section class="section-block">
          <h2 class="section-block-title">Temario</h2>
          <div class="temas">${temasHtml}</div>
        </section>
        </div>
      </body>
      </html>
    `;
  }

  private sanitizeRichTextHtml(html: string) {
    return html.replace(
      /<a\b([^>]*)href=(["'])(.*?)\2([^>]*)>/gi,
      (_, before: string, quote: string, href: string, after: string) => {
        const normalizedHref = this.normalizeAllowedLink(href);

        if (!normalizedHref) {
          return '<a>';
        }

        return `<a${before}href=${quote}${normalizedHref}${quote}${after}>`;
      },
    );
  }

  private normalizeAllowedLink(href: string) {
    const value = href.trim();

    if (!/^https?:\/\//i.test(value)) {
      return undefined;
    }

    return value;
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  }

  private formatTimeRange(start: Date | null, end: Date | null) {
    if (!start && !end) {
      return '-';
    }

    const formatter = new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const startLabel = start ? formatter.format(start) : '--:--';
    const endLabel = end ? formatter.format(end) : '--:--';

    return `${startLabel} - ${endLabel}`;
  }

  private formatEstado(value: ESTADO_TEMARIO) {
    switch (value) {
      case 'EN_TRATAMIENTO':
        return 'En tratamiento';
      case 'TRATADO':
        return 'Tratado';
      case 'POSPUESTO':
        return 'Pospuesto';
      default:
        return 'Pendiente';
    }
  }

  private resolveAttendanceDescription(miembro: AttendanceMember) {
    if (miembro.Adulto) {
      return 'Representante adulto';
    }

    if (miembro.Protagonista) {
      return 'Representante juvenil';
    }

    return 'Responsable';
  }

  private resolveAttendanceCategory(miembro: AttendanceMember) {
    if (miembro.Adulto) {
      return 'Adulto';
    }

    if (miembro.Protagonista) {
      const ramaNombre =
        miembro.Protagonista.Miembro.MiembroRama[0]?.Rama.nombre ?? 'Sin rama';
      return `Protagonista ${ramaNombre}`;
    }

    return 'Responsable';
  }

  private resolveAttendanceSortOrder(miembro: AttendanceMember) {
    if (miembro.Adulto) {
      return 1;
    }

    if (miembro.Protagonista) {
      const ramaNombre =
        miembro.Protagonista.Miembro.MiembroRama[0]?.Rama.nombre ?? '';

      if (ramaNombre === 'Rovers') {
        return 2;
      }

      if (ramaNombre === 'Caminantes') {
        return 3;
      }

      return 4;
    }

    return 5;
  }

  private async ensureTemarioExists(idConsejo: number, temarioId: number) {
    const temario = await this.prisma.temarioConsejo.findFirst({
      where: {
        id: temarioId,
        id_consejo: idConsejo,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!temario) {
      throw new NotFoundException(
        'El tema indicado no existe en este consejo.',
      );
    }
  }
}
