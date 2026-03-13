import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsejoDto } from './dto/create-consejo.dto';
import { UpdateConsejoDto } from './dto/update-consejo.dto';
import { CreateTemarioConsejoDto } from './dto/create-temario-consejo.dto';
import { UpdateTemarioConsejoDto } from './dto/update-temario-consejo.dto';
import { ConsejoAsistenciaOptionsQueryDto } from './dto/consejo-asistencia-options-query.dto';
import { CreateAsistenciaConsejoDto } from './dto/create-asistencia-consejo.dto';
export declare class ConsejosService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(user: AuthenticatedUser, paginationQuery: PaginationQueryDto): Promise<{
        data: {
            id: number;
            nombre: string;
            descripcion: string | null;
            _count: {
                AsistenciaConsejo: number;
                TemarioConsejo: number;
            };
            fecha: Date;
            es_ordinario: boolean;
            hora_inicio: Date | null;
            hora_fin: Date | null;
            TemarioConsejo: {
                id: number;
                descripcion: string | null;
                titulo: string;
                debate: string | null;
                acuerdo: string | null;
                estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
                sin_mp: boolean;
            }[];
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: number, user: AuthenticatedUser): Promise<{
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            AsistenciaConsejo: number;
            TemarioConsejo: number;
        };
        fecha: Date;
        es_ordinario: boolean;
        hora_inicio: Date | null;
        hora_fin: Date | null;
        TemarioConsejo: {
            id: number;
            descripcion: string | null;
            titulo: string;
            debate: string | null;
            acuerdo: string | null;
            estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
            sin_mp: boolean;
        }[];
    }>;
    create(dto: CreateConsejoDto): Promise<{
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            AsistenciaConsejo: number;
            TemarioConsejo: number;
        };
        fecha: Date;
        es_ordinario: boolean;
        hora_inicio: Date | null;
        hora_fin: Date | null;
        TemarioConsejo: {
            id: number;
            descripcion: string | null;
            titulo: string;
            debate: string | null;
            acuerdo: string | null;
            estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
            sin_mp: boolean;
        }[];
    }>;
    exportPdf(idConsejo: number, user: AuthenticatedUser, includePrivateTopics: boolean): Promise<{
        filename: string;
        buffer: Buffer<ArrayBufferLike>;
    }>;
    findAsistencias(idConsejo: number): Promise<{
        id: number;
        descripcion: string;
        Miembro: {
            id: number;
            nombre: string;
            dni: string;
            apellidos: string;
            Protagonista: {
                id: number;
                Miembro: {
                    MiembroRama: {
                        Rama: {
                            id: number;
                            nombre: string;
                        };
                    }[];
                };
            } | null;
            Adulto: {
                id: number;
            } | null;
            Responsable: {
                id: number;
            } | null;
        };
    }[]>;
    getAsistenciaOptions(idConsejo: number, query: ConsejoAsistenciaOptionsQueryDto): Promise<{
        displayLabel: string;
        categoryLabel: string;
        sortOrder: number;
        id: number;
        nombre: string;
        dni: string;
        apellidos: string;
        Protagonista: {
            id: number;
            Miembro: {
                MiembroRama: {
                    Rama: {
                        id: number;
                        nombre: string;
                    };
                }[];
            };
        } | null;
        Adulto: {
            id: number;
        } | null;
        Responsable: {
            id: number;
        } | null;
    }[]>;
    findTemario(id: number, user: AuthenticatedUser): Promise<{
        id: number;
        descripcion: string | null;
        titulo: string;
        debate: string | null;
        acuerdo: string | null;
        estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
        sin_mp: boolean;
    }[]>;
    createTemario(idConsejo: number, dto: CreateTemarioConsejoDto): Promise<{
        id: number;
        descripcion: string | null;
        titulo: string;
        debate: string | null;
        acuerdo: string | null;
        estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
        sin_mp: boolean;
    }>;
    createAsistencia(idConsejo: number, dto: CreateAsistenciaConsejoDto): Promise<{
        id: number;
        descripcion: string;
        Miembro: {
            id: number;
            nombre: string;
            dni: string;
            apellidos: string;
            Protagonista: {
                id: number;
                Miembro: {
                    MiembroRama: {
                        Rama: {
                            id: number;
                            nombre: string;
                        };
                    }[];
                };
            } | null;
            Adulto: {
                id: number;
            } | null;
            Responsable: {
                id: number;
            } | null;
        };
    }>;
    update(id: number, dto: UpdateConsejoDto): Promise<{
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            AsistenciaConsejo: number;
            TemarioConsejo: number;
        };
        fecha: Date;
        es_ordinario: boolean;
        hora_inicio: Date | null;
        hora_fin: Date | null;
        TemarioConsejo: {
            id: number;
            descripcion: string | null;
            titulo: string;
            debate: string | null;
            acuerdo: string | null;
            estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
            sin_mp: boolean;
        }[];
    }>;
    remove(id: number): Promise<void>;
    updateTemario(idConsejo: number, temarioId: number, dto: UpdateTemarioConsejoDto): Promise<{
        id: number;
        descripcion: string | null;
        titulo: string;
        debate: string | null;
        acuerdo: string | null;
        estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
        sin_mp: boolean;
    }>;
    removeTemario(idConsejo: number, temarioId: number): Promise<void>;
    private buildConsejoSelect;
    private temarioSelect;
    private memberAttendanceSelect;
    private normalizeCreatePayload;
    private normalizeUpdatePayload;
    private validateNormalizedPayload;
    private normalizeTemarioCreatePayload;
    private normalizeTemarioUpdatePayload;
    private shouldHidePrivateTemario;
    private ensureExists;
    private ensureUniqueNombre;
    private getConsejoExportData;
    private buildPdfBuffer;
    private drawHeaderCard;
    private drawSectionTitle;
    private drawTemaCard;
    private formatDate;
    private formatTimeRange;
    private formatEstado;
    private resolveAttendanceDescription;
    private resolveAttendanceCategory;
    private resolveAttendanceSortOrder;
    private ensureTemarioExists;
}
