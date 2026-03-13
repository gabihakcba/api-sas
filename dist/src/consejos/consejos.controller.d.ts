import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ConsejosService } from './consejos.service';
import { CreateConsejoDto } from './dto/create-consejo.dto';
import { UpdateConsejoDto } from './dto/update-consejo.dto';
import { CreateTemarioConsejoDto } from './dto/create-temario-consejo.dto';
import { UpdateTemarioConsejoDto } from './dto/update-temario-consejo.dto';
import { ConsejoAsistenciaOptionsQueryDto } from './dto/consejo-asistencia-options-query.dto';
import { CreateAsistenciaConsejoDto } from './dto/create-asistencia-consejo.dto';
export declare class ConsejosController {
    private readonly consejosService;
    constructor(consejosService: ConsejosService);
    findAll(req: AuthenticatedRequest, paginationQuery: PaginationQueryDto): Promise<{
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
    findOne(req: AuthenticatedRequest, id: number): Promise<{
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
    findTemario(req: AuthenticatedRequest, id: number): Promise<{
        id: number;
        descripcion: string | null;
        titulo: string;
        debate: string | null;
        acuerdo: string | null;
        estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
        sin_mp: boolean;
    }[]>;
    findAsistencias(id: number): Promise<{
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
    getAsistenciaOptions(id: number, query: ConsejoAsistenciaOptionsQueryDto): Promise<{
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
    exportPdf(req: AuthenticatedRequest, id: number, res: Response): Promise<void>;
    exportPdfPublic(req: AuthenticatedRequest, id: number, res: Response): Promise<void>;
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
    createTemario(id: number, dto: CreateTemarioConsejoDto): Promise<{
        id: number;
        descripcion: string | null;
        titulo: string;
        debate: string | null;
        acuerdo: string | null;
        estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
        sin_mp: boolean;
    }>;
    createAsistencia(id: number, dto: CreateAsistenciaConsejoDto): Promise<{
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
    updateTemario(id: number, temarioId: number, dto: UpdateTemarioConsejoDto): Promise<{
        id: number;
        descripcion: string | null;
        titulo: string;
        debate: string | null;
        acuerdo: string | null;
        estado: import(".prisma/client").$Enums.ESTADO_TEMARIO;
        sin_mp: boolean;
    }>;
    remove(id: number): Promise<void>;
    removeTemario(id: number, temarioId: number): Promise<void>;
}
