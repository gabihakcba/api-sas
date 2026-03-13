import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PrismaService } from '../prisma/prisma.service';
import { CuentasService } from '../cuentas/cuentas.service';
import { CreateProtagonistaDto } from './dto/create-protagonista.dto';
import { ProtagonistaPaseDto } from './dto/protagonista-pase.dto';
import { UpdateProtagonistaDto } from './dto/update-protagonista.dto';
export declare class ProtagonistasService {
    private readonly prisma;
    private readonly cuentasService;
    private readonly scopeFilterService;
    constructor(prisma: PrismaService, cuentasService: CuentasService, scopeFilterService: ScopeFilterService);
    findAll(user: AuthenticatedUser, paginationQuery: PaginationQueryDto): Promise<{
        data: {
            id: number;
            Miembro: {
                id: number;
                nombre: string;
                MiembroRama: {
                    Rama: {
                        id: number;
                        nombre: string;
                        id_area: number;
                    };
                    id: number;
                    fecha_ingreso: Date;
                }[];
                dni: string;
                email: string | null;
                apellidos: string;
                telefono: string | null;
            };
            es_becado: boolean;
            activo: boolean;
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
        Miembro: {
            id: number;
            nombre: string;
            MiembroRama: {
                Rama: {
                    id: number;
                    nombre: string;
                    id_area: number;
                };
                id: number;
                id_rama: number;
                fecha_ingreso: Date;
            }[];
            Cuenta: {
                id: number;
                user: string;
            };
            dni: string;
            email: string | null;
            apellidos: string;
            fecha_nacimiento: Date;
            direccion: string;
            telefono: string | null;
            telefono_emergencia: string;
            totem: string | null;
            cualidad: string | null;
        };
        es_becado: boolean;
        activo: boolean;
    }>;
    create(dto: CreateProtagonistaDto): Promise<{
        cuenta: {
            id: number;
            user: string;
        };
        miembro: {
            id: number;
            nombre: string;
            apellidos: string;
            dni: string;
        };
        protagonista: {
            id: number;
            es_becado: boolean;
            activo: boolean;
        };
        rama: {
            id: number;
            nombre: string;
        };
        miembroRama: {
            id: number;
            fecha_ingreso: Date;
        };
    }>;
    update(id: number, dto: UpdateProtagonistaDto, user: AuthenticatedUser): Promise<{
        id: number;
        Miembro: {
            id: number;
            nombre: string;
            MiembroRama: {
                Rama: {
                    id: number;
                    nombre: string;
                    id_area: number;
                };
                id: number;
                id_rama: number;
                fecha_ingreso: Date;
            }[];
            Cuenta: {
                id: number;
                user: string;
            };
            dni: string;
            email: string | null;
            apellidos: string;
            fecha_nacimiento: Date;
            direccion: string;
            telefono: string | null;
            telefono_emergencia: string;
            totem: string | null;
            cualidad: string | null;
        };
        es_becado: boolean;
        activo: boolean;
    }>;
    registerPase(id: number, dto: ProtagonistaPaseDto, user: AuthenticatedUser): Promise<{
        id: number;
        Miembro: {
            id: number;
            nombre: string;
            MiembroRama: {
                Rama: {
                    id: number;
                    nombre: string;
                    id_area: number;
                };
                id: number;
                id_rama: number;
                fecha_ingreso: Date;
            }[];
            Cuenta: {
                id: number;
                user: string;
            };
            dni: string;
            email: string | null;
            apellidos: string;
            fecha_nacimiento: Date;
            direccion: string;
            telefono: string | null;
            telefono_emergencia: string;
            totem: string | null;
            cualidad: string | null;
        };
        es_becado: boolean;
        activo: boolean;
    }>;
    remove(id: number, user: AuthenticatedUser): Promise<void>;
    private ensureProtagonistaRoleAssignment;
    private removeProtagonistaRoleAssignment;
    private ensureCuentaDineroProtagonista;
}
