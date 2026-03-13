import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ESTADO_TEMARIO, Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsejoDto } from './dto/create-consejo.dto';
import { UpdateConsejoDto } from './dto/update-consejo.dto';
import { CreateTemarioConsejoDto } from './dto/create-temario-consejo.dto';
import { UpdateTemarioConsejoDto } from './dto/update-temario-consejo.dto';
import { ConsejoAsistenciaOptionsQueryDto } from './dto/consejo-asistencia-options-query.dto';
import { CreateAsistenciaConsejoDto } from './dto/create-asistencia-consejo.dto';

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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser, paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.consejo.findMany({
        where: {
          borrado: false,
        },
        skip,
        take: limit,
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        select: this.buildConsejoSelect(user),
      }),
      this.prisma.consejo.count({
        where: {
          borrado: false,
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
    const allowPrivateTopics =
      includePrivateTopics && !this.shouldHidePrivateTemario(user);
    const consejo = await this.getConsejoExportData(
      idConsejo,
      allowPrivateTopics,
    );
    const buffer = await this.buildPdfBuffer(consejo, allowPrivateTopics);
    const slug = consejo.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return {
      filename: `${slug || 'consejo'}${
        allowPrivateTopics ? '' : '-publico'
      }.pdf`,
      buffer,
    };
  }

  async findAsistencias(idConsejo: number) {
    await this.ensureExists(idConsejo);

    return this.prisma.asistenciaConsejo.findMany({
      where: {
        id_consejo: idConsejo,
        borrado: false,
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
        borrado: false,
        AND: [
          {
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
                Protagonista: {
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
            ],
          },
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

  async createTemario(idConsejo: number, dto: CreateTemarioConsejoDto) {
    await this.ensureExists(idConsejo);
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
        borrado: false,
      },
      select: this.memberAttendanceSelect(),
    });

    if (!miembro) {
      throw new NotFoundException('El miembro indicado no existe.');
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
  ) {
    await this.ensureExists(idConsejo);
    await this.ensureTemarioExists(idConsejo, temarioId);
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

  async removeTemario(idConsejo: number, temarioId: number) {
    await this.ensureExists(idConsejo);
    await this.ensureTemarioExists(idConsejo, temarioId);

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
      nombre: true,
      descripcion: true,
      fecha: true,
      es_ordinario: true,
      hora_inicio: true,
      hora_fin: true,
      TemarioConsejo: {
        where: {
          borrado: false,
          ...(shouldHidePrivateTemario ? { sin_mp: false } : {}),
        },
        orderBy: {
          id: 'asc',
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
    } satisfies Prisma.ConsejoSelect;
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
    const debate = dto.debate?.trim() || null;
    const acuerdo = dto.acuerdo?.trim() || null;

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
      dto.debate !== undefined ? dto.debate.trim() || null : undefined;
    const acuerdo =
      dto.acuerdo !== undefined ? dto.acuerdo.trim() || null : undefined;

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
            id: 'asc',
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

  private async buildPdfBuffer(
    consejo: ConsejoExportData,
    includePrivateTopics: boolean,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 48,
      });

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);

      this.drawHeaderCard(doc, consejo, includePrivateTopics);
      this.drawSectionTitle(doc, 'Asistencia');

      if (consejo.AsistenciaConsejo.length === 0) {
        doc
          .fillColor('#3f4a5a')
          .fontSize(11)
          .text('Sin asistencias registradas.');
      } else {
        consejo.AsistenciaConsejo.forEach((asistencia) => {
          doc
            .fillColor('#1f2937')
            .fontSize(11)
            .text(
              `- ${asistencia.Miembro.apellidos}, ${asistencia.Miembro.nombre} (${asistencia.descripcion})`,
            );
        });
      }

      this.drawSectionTitle(doc, 'Temario');

      if (consejo.TemarioConsejo.length === 0) {
        doc.fillColor('#3f4a5a').fontSize(11).text('Sin temas registrados.');
      } else {
        consejo.TemarioConsejo.forEach((tema, index) => {
          this.drawTemaCard(doc, tema, index);
        });
      }

      doc.end();
    });
  }

  private drawHeaderCard(
    doc: InstanceType<typeof PDFDocument>,
    consejo: ConsejoExportData,
    includePrivateTopics: boolean,
  ) {
    const left = doc.page.margins.left;
    const width =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const top = doc.y;
    const cardHeight = consejo.descripcion ? 128 : 96;

    doc.save();
    doc.roundedRect(left, top, width, cardHeight, 12).fill('#eef4ff');
    doc.restore();

    doc
      .fillColor('#0f172a')
      .fontSize(20)
      .text(consejo.nombre, left + 18, top + 16, {
        width: width - 36,
      });

    doc
      .fillColor('#334155')
      .fontSize(11)
      .text(`Fecha: ${this.formatDate(consejo.fecha)}`, left + 18, top + 48)
      .text(
        `Tipo: ${consejo.es_ordinario ? 'Ordinario' : 'Extraordinario'}`,
        left + 18,
        top + 64,
      )
      .text(
        `Horario: ${this.formatTimeRange(consejo.hora_inicio, consejo.hora_fin)}`,
        left + 220,
        top + 48,
      )
      .text(
        `Version: ${includePrivateTopics ? 'Completa' : 'Sin temas sin_mp'}`,
        left + 220,
        top + 64,
      );

    if (consejo.descripcion) {
      doc
        .fillColor('#1e293b')
        .fontSize(10)
        .text(consejo.descripcion, left + 18, top + 86, {
          width: width - 36,
        });
    }

    doc.y = top + cardHeight + 18;
  }

  private drawSectionTitle(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
  ) {
    doc.moveDown(0.5);
    doc.fillColor('#0f172a').fontSize(14).text(title);
    doc
      .moveTo(doc.page.margins.left, doc.y + 4)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
      .strokeColor('#cbd5e1')
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.8);
  }

  private drawTemaCard(
    doc: InstanceType<typeof PDFDocument>,
    tema: ConsejoExportData['TemarioConsejo'][number],
    index: number,
  ) {
    const left = doc.page.margins.left;
    const width =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const top = doc.y;
    const descripcionHeight = tema.descripcion ? 28 : 0;
    const debateText = tema.debate?.trim()
      ? tema.debate
      : 'Sin debate cargado.';
    const acuerdoText = tema.acuerdo?.trim()
      ? tema.acuerdo
      : 'Sin acuerdo cargado.';
    const debateHeight = doc.heightOfString(debateText, {
      width: width - 40,
      align: 'left',
    });
    const acuerdoHeight = doc.heightOfString(acuerdoText, {
      width: width - 40,
      align: 'left',
    });
    const cardHeight =
      108 +
      descripcionHeight +
      Math.max(debateHeight, 18) +
      Math.max(acuerdoHeight, 18);

    if (top + cardHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }

    const effectiveTop = doc.y;

    doc.save();
    doc.roundedRect(left, effectiveTop, width, cardHeight, 10).fill('#f8fafc');
    doc.roundedRect(left, effectiveTop, 6, cardHeight, 10).fill('#93c5fd');
    doc.restore();

    doc
      .fillColor('#0f172a')
      .fontSize(13)
      .text(`${index + 1}. ${tema.titulo}`, left + 18, effectiveTop + 14, {
        width: width - 36,
      });

    doc
      .fillColor('#475569')
      .fontSize(10)
      .text(
        `Estado: ${this.formatEstado(tema.estado)}`,
        left + 18,
        effectiveTop + 36,
      )
      .text(
        `Sin MP: ${tema.sin_mp ? 'Si' : 'No'}`,
        left + 190,
        effectiveTop + 36,
      );

    let cursorY = effectiveTop + 54;

    if (tema.descripcion) {
      doc
        .fillColor('#1e293b')
        .fontSize(10)
        .text(`Descripcion: ${tema.descripcion}`, left + 18, cursorY, {
          width: width - 36,
        });
      cursorY += descripcionHeight;
    }

    doc
      .fillColor('#0f172a')
      .fontSize(11)
      .text('Debate', left + 18, cursorY);
    cursorY += 16;
    doc
      .fillColor('#334155')
      .fontSize(10)
      .text(debateText, left + 18, cursorY, {
        width: width - 36,
      });
    cursorY += Math.max(debateHeight, 18) + 12;

    doc
      .fillColor('#0f172a')
      .fontSize(11)
      .text('Acuerdo', left + 18, cursorY);
    cursorY += 16;
    doc
      .fillColor('#334155')
      .fontSize(10)
      .text(acuerdoText, left + 18, cursorY, {
        width: width - 36,
      });

    doc.y = effectiveTop + cardHeight + 14;
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
