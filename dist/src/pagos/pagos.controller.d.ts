import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { PagosService } from './pagos.service';
export declare class PagosController {
    private readonly pagosService;
    constructor(pagosService: PagosService);
    findAll(req: AuthenticatedRequest, paginationQuery: PaginationQueryDto): Promise<{
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
            monto: import("@prisma/client-runtime-utils").Decimal;
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
    getOptions(req: AuthenticatedRequest): Promise<{
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
            monto_actual: import("@prisma/client-runtime-utils").Decimal;
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
    findOne(req: AuthenticatedRequest, id: number): Promise<{
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
        monto: import("@prisma/client-runtime-utils").Decimal;
        detalles: string | null;
        fecha_pago: Date;
        codigo_validacion: string;
        CuentaOrigen: {
            id: number;
            nombre: string;
        } | null;
    }>;
    create(req: AuthenticatedRequest, dto: CreatePagoDto): Promise<{
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
        monto: import("@prisma/client-runtime-utils").Decimal;
        detalles: string | null;
        fecha_pago: Date;
        codigo_validacion: string;
        CuentaOrigen: {
            id: number;
            nombre: string;
        } | null;
    } | null>;
    update(req: AuthenticatedRequest, id: number, dto: UpdatePagoDto): Promise<{
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
        monto: import("@prisma/client-runtime-utils").Decimal;
        detalles: string | null;
        fecha_pago: Date;
        codigo_validacion: string;
        CuentaOrigen: {
            id: number;
            nombre: string;
        } | null;
    } | null>;
    remove(req: AuthenticatedRequest, id: number): Promise<void>;
}
