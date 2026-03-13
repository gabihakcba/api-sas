import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
export declare class PagosService {
    private readonly prisma;
    private readonly scopeFilterService;
    constructor(prisma: PrismaService, scopeFilterService: ScopeFilterService);
    findAll(user: AuthenticatedUser, paginationQuery: PaginationQueryDto): Promise<{
        data: {
            id: number;
            CuentaDinero: {
                id: number;
                nombre: string;
            };
            Miembro: {
                id: number;
                nombre: string;
                dni: string;
                apellidos: string;
            };
            Evento: {
                id: number;
                nombre: string;
            } | null;
            ConceptoPago: {
                id: number;
                nombre: string;
            };
            MetodoPago: {
                id: number;
                nombre: string;
            };
            monto: Prisma.Decimal;
            detalles: string | null;
            fecha_pago: Date;
            codigo_validacion: string;
            CuentaOrigen: {
                id: number;
                nombre: string;
            } | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOptions(user: AuthenticatedUser): Promise<{
        cuentas: {
            Rama: {
                id: number;
                nombre: string;
            } | null;
            id: number;
            nombre: string;
            Area: {
                id: number;
                nombre: string;
            } | null;
            Miembro: {
                id: number;
                nombre: string;
                apellidos: string;
            } | null;
            id_miembro: number | null;
            monto_actual: Prisma.Decimal;
        }[];
        conceptos: {
            id: number;
            nombre: string;
        }[];
        metodos: {
            id: number;
            nombre: string;
        }[];
        miembros: {
            id: number;
            nombre: string;
            dni: string;
            apellidos: string;
        }[];
    }>;
    findOne(id: number, user: AuthenticatedUser): Promise<{
        id: number;
        CuentaDinero: {
            id: number;
            nombre: string;
        };
        Miembro: {
            id: number;
            nombre: string;
            dni: string;
            apellidos: string;
        };
        Evento: {
            id: number;
            nombre: string;
        } | null;
        ConceptoPago: {
            id: number;
            nombre: string;
        };
        MetodoPago: {
            id: number;
            nombre: string;
        };
        monto: Prisma.Decimal;
        detalles: string | null;
        fecha_pago: Date;
        codigo_validacion: string;
        CuentaOrigen: {
            id: number;
            nombre: string;
        } | null;
    }>;
    create(dto: CreatePagoDto, user: AuthenticatedUser): Promise<{
        id: number;
        CuentaDinero: {
            id: number;
            nombre: string;
        };
        Miembro: {
            id: number;
            nombre: string;
            dni: string;
            apellidos: string;
        };
        Evento: {
            id: number;
            nombre: string;
        } | null;
        ConceptoPago: {
            id: number;
            nombre: string;
        };
        MetodoPago: {
            id: number;
            nombre: string;
        };
        monto: Prisma.Decimal;
        detalles: string | null;
        fecha_pago: Date;
        codigo_validacion: string;
        CuentaOrigen: {
            id: number;
            nombre: string;
        } | null;
    } | null>;
    update(id: number, dto: UpdatePagoDto, user: AuthenticatedUser): Promise<{
        id: number;
        CuentaDinero: {
            id: number;
            nombre: string;
        };
        Miembro: {
            id: number;
            nombre: string;
            dni: string;
            apellidos: string;
        };
        Evento: {
            id: number;
            nombre: string;
        } | null;
        ConceptoPago: {
            id: number;
            nombre: string;
        };
        MetodoPago: {
            id: number;
            nombre: string;
        };
        monto: Prisma.Decimal;
        detalles: string | null;
        fecha_pago: Date;
        codigo_validacion: string;
        CuentaOrigen: {
            id: number;
            nombre: string;
        } | null;
    } | null>;
    remove(id: number, user: AuthenticatedUser): Promise<void>;
    private pagoSelect;
    private findOneWithinClient;
    private resolvePagoData;
    private findAccessibleCuentaOrThrow;
    private ensureVisibleMiembro;
    private applyPagoImpact;
    private ensureCanDebitOrigin;
    private ensureCanRevertDestination;
    private buildVisibleMiembroWhere;
    private hasFullAccess;
}
