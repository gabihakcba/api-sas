"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsejosService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pdfkit_1 = require("pdfkit");
const prisma_service_1 = require("../prisma/prisma.service");
let ConsejosService = class ConsejosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(user, paginationQuery) {
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
    async findOne(id, user) {
        const consejo = await this.prisma.consejo.findFirst({
            where: {
                id,
                borrado: false,
            },
            select: this.buildConsejoSelect(user),
        });
        if (!consejo) {
            throw new common_1.NotFoundException('El consejo indicado no existe.');
        }
        return consejo;
    }
    async create(dto) {
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
    async exportPdf(idConsejo, user, includePrivateTopics) {
        const allowPrivateTopics = includePrivateTopics && !this.shouldHidePrivateTemario(user);
        const consejo = await this.getConsejoExportData(idConsejo, allowPrivateTopics);
        const buffer = await this.buildPdfBuffer(consejo, allowPrivateTopics);
        const slug = consejo.nombre
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        return {
            filename: `${slug || 'consejo'}${allowPrivateTopics ? '' : '-publico'}.pdf`,
            buffer,
        };
    }
    async findAsistencias(idConsejo) {
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
    async getAsistenciaOptions(idConsejo, query) {
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
                                            mode: client_1.Prisma.QueryMode.insensitive,
                                        },
                                    },
                                    {
                                        apellidos: {
                                            contains: search,
                                            mode: client_1.Prisma.QueryMode.insensitive,
                                        },
                                    },
                                    {
                                        dni: {
                                            contains: search,
                                            mode: client_1.Prisma.QueryMode.insensitive,
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
            return `${left.apellidos} ${left.nombre}`.localeCompare(`${right.apellidos} ${right.nombre}`, 'es');
        });
    }
    async findTemario(id, user) {
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
    async createTemario(idConsejo, dto) {
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
    async createAsistencia(idConsejo, dto) {
        await this.ensureExists(idConsejo);
        const miembro = await this.prisma.miembro.findFirst({
            where: {
                id: dto.idMiembro,
                borrado: false,
            },
            select: this.memberAttendanceSelect(),
        });
        if (!miembro) {
            throw new common_1.NotFoundException('El miembro indicado no existe.');
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
            throw new common_1.ConflictException('Ese miembro ya figura como asistente del consejo.');
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
    async update(id, dto) {
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
    async remove(id) {
        await this.ensureExists(id);
        await this.prisma.consejo.update({
            where: { id },
            data: {
                borrado: true,
            },
        });
    }
    async updateTemario(idConsejo, temarioId, dto) {
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
    async removeTemario(idConsejo, temarioId) {
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
    buildConsejoSelect(user) {
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
        };
    }
    temarioSelect() {
        return {
            id: true,
            titulo: true,
            descripcion: true,
            debate: true,
            acuerdo: true,
            sin_mp: true,
            estado: true,
        };
    }
    memberAttendanceSelect() {
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
        };
    }
    normalizeCreatePayload(dto) {
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
    normalizeUpdatePayload(dto) {
        const nombre = dto.nombre !== undefined
            ? dto.nombre.trim().replace(/\s+/g, ' ')
            : undefined;
        const descripcion = dto.descripcion !== undefined
            ? dto.descripcion.trim() || null
            : undefined;
        const fecha = dto.fecha !== undefined ? new Date(dto.fecha) : undefined;
        const horaInicio = dto.horaInicio !== undefined ? new Date(dto.horaInicio) : undefined;
        const horaFin = dto.horaFin !== undefined ? new Date(dto.horaFin) : undefined;
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
    validateNormalizedPayload(nombre, horaInicio, horaFin) {
        if (nombre !== undefined && nombre.length < 3) {
            throw new common_1.BadRequestException('El nombre del consejo debe tener al menos 3 caracteres.');
        }
        if (horaInicio && horaFin && horaInicio > horaFin) {
            throw new common_1.BadRequestException('La hora de inicio no puede ser posterior a la hora de fin.');
        }
    }
    normalizeTemarioCreatePayload(dto) {
        const titulo = dto.titulo.trim().replace(/\s+/g, ' ');
        const descripcion = dto.descripcion?.trim() || null;
        const debate = dto.debate?.trim() || null;
        const acuerdo = dto.acuerdo?.trim() || null;
        if (titulo.length < 3) {
            throw new common_1.BadRequestException('El titulo del tema debe tener al menos 3 caracteres.');
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
    normalizeTemarioUpdatePayload(dto) {
        const titulo = dto.titulo !== undefined
            ? dto.titulo.trim().replace(/\s+/g, ' ')
            : undefined;
        const descripcion = dto.descripcion !== undefined
            ? dto.descripcion.trim() || null
            : undefined;
        const debate = dto.debate !== undefined ? dto.debate.trim() || null : undefined;
        const acuerdo = dto.acuerdo !== undefined ? dto.acuerdo.trim() || null : undefined;
        if (titulo !== undefined && titulo.length < 3) {
            throw new common_1.BadRequestException('El titulo del tema debe tener al menos 3 caracteres.');
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
    shouldHidePrivateTemario(user) {
        if (!user) {
            return false;
        }
        return (user.roles.includes('PROTAGONISTA') || user.roles.includes('RESPONSABLE'));
    }
    async ensureExists(id) {
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
            throw new common_1.NotFoundException('El consejo indicado no existe.');
        }
    }
    async ensureUniqueNombre(nombre, excludeId) {
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
            throw new common_1.ConflictException('Ya existe un consejo activo con ese nombre.');
        }
    }
    async getConsejoExportData(idConsejo, includePrivateTopics) {
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
            throw new common_1.NotFoundException('El consejo indicado no existe.');
        }
        return {
            ...consejo,
            AsistenciaConsejo: [...consejo.AsistenciaConsejo].sort((left, right) => {
                const leftOrder = this.resolveAttendanceSortOrder(left.Miembro);
                const rightOrder = this.resolveAttendanceSortOrder(right.Miembro);
                if (leftOrder !== rightOrder) {
                    return leftOrder - rightOrder;
                }
                return `${left.Miembro.apellidos} ${left.Miembro.nombre}`.localeCompare(`${right.Miembro.apellidos} ${right.Miembro.nombre}`, 'es');
            }),
        };
    }
    async buildPdfBuffer(consejo, includePrivateTopics) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const doc = new pdfkit_1.default({
                size: 'A4',
                margin: 48,
            });
            doc.on('data', (chunk) => {
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
            }
            else {
                consejo.AsistenciaConsejo.forEach((asistencia) => {
                    doc
                        .fillColor('#1f2937')
                        .fontSize(11)
                        .text(`- ${asistencia.Miembro.apellidos}, ${asistencia.Miembro.nombre} (${asistencia.descripcion})`);
                });
            }
            this.drawSectionTitle(doc, 'Temario');
            if (consejo.TemarioConsejo.length === 0) {
                doc.fillColor('#3f4a5a').fontSize(11).text('Sin temas registrados.');
            }
            else {
                consejo.TemarioConsejo.forEach((tema, index) => {
                    this.drawTemaCard(doc, tema, index);
                });
            }
            doc.end();
        });
    }
    drawHeaderCard(doc, consejo, includePrivateTopics) {
        const left = doc.page.margins.left;
        const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
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
            .text(`Tipo: ${consejo.es_ordinario ? 'Ordinario' : 'Extraordinario'}`, left + 18, top + 64)
            .text(`Horario: ${this.formatTimeRange(consejo.hora_inicio, consejo.hora_fin)}`, left + 220, top + 48)
            .text(`Version: ${includePrivateTopics ? 'Completa' : 'Sin temas sin_mp'}`, left + 220, top + 64);
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
    drawSectionTitle(doc, title) {
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
    drawTemaCard(doc, tema, index) {
        const left = doc.page.margins.left;
        const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
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
        const cardHeight = 108 +
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
            .text(`Estado: ${this.formatEstado(tema.estado)}`, left + 18, effectiveTop + 36)
            .text(`Sin MP: ${tema.sin_mp ? 'Si' : 'No'}`, left + 190, effectiveTop + 36);
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
    formatDate(value) {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(value);
    }
    formatTimeRange(start, end) {
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
    formatEstado(value) {
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
    resolveAttendanceDescription(miembro) {
        if (miembro.Adulto) {
            return 'Representante adulto';
        }
        if (miembro.Protagonista) {
            return 'Representante juvenil';
        }
        return 'Responsable';
    }
    resolveAttendanceCategory(miembro) {
        if (miembro.Adulto) {
            return 'Adulto';
        }
        if (miembro.Protagonista) {
            const ramaNombre = miembro.Protagonista.Miembro.MiembroRama[0]?.Rama.nombre ?? 'Sin rama';
            return `Protagonista ${ramaNombre}`;
        }
        return 'Responsable';
    }
    resolveAttendanceSortOrder(miembro) {
        if (miembro.Adulto) {
            return 1;
        }
        if (miembro.Protagonista) {
            const ramaNombre = miembro.Protagonista.Miembro.MiembroRama[0]?.Rama.nombre ?? '';
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
    async ensureTemarioExists(idConsejo, temarioId) {
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
            throw new common_1.NotFoundException('El tema indicado no existe en este consejo.');
        }
    }
};
exports.ConsejosService = ConsejosService;
exports.ConsejosService = ConsejosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConsejosService);
//# sourceMappingURL=consejos.service.js.map