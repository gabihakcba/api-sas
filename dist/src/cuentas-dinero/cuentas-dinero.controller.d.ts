import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CuentasDineroService } from './cuentas-dinero.service';
import { CreateCuentaDineroDto } from './dto/create-cuenta-dinero.dto';
import { UpdateCuentaDineroDto } from './dto/update-cuenta-dinero.dto';
export declare class CuentasDineroController {
    private readonly cuentasDineroService;
    constructor(cuentasDineroService: CuentasDineroService);
    findAll(req: AuthenticatedRequest, paginationQuery: PaginationQueryDto): Promise<{
        data: {
            Rama: {
                id: number;
                nombre: string;
                id_area: number;
            } | null;
            id: number;
            nombre: string;
            descripcion: string | null;
            _count: {
                Pago: number;
            };
            Area: {
                id: number;
                nombre: string;
            } | null;
            id_area: number | null;
            id_rama: number | null;
            monto_actual: import("@prisma/client-runtime-utils").Decimal;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOptions(req: AuthenticatedRequest): Promise<{
        areas: {
            id: number;
            nombre: string;
        }[];
        ramas: {
            id: number;
            nombre: string;
            id_area: number;
        }[];
    }>;
    findOne(req: AuthenticatedRequest, id: number): Promise<{
        Rama: {
            id: number;
            nombre: string;
            id_area: number;
        } | null;
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            Pago: number;
        };
        Area: {
            id: number;
            nombre: string;
        } | null;
        id_area: number | null;
        id_rama: number | null;
        monto_actual: import("@prisma/client-runtime-utils").Decimal;
    }>;
    create(req: AuthenticatedRequest, dto: CreateCuentaDineroDto): Promise<{
        Rama: {
            id: number;
            nombre: string;
            id_area: number;
        } | null;
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            Pago: number;
        };
        Area: {
            id: number;
            nombre: string;
        } | null;
        id_area: number | null;
        id_rama: number | null;
        monto_actual: import("@prisma/client-runtime-utils").Decimal;
    }>;
    update(req: AuthenticatedRequest, id: number, dto: UpdateCuentaDineroDto): Promise<{
        Rama: {
            id: number;
            nombre: string;
            id_area: number;
        } | null;
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            Pago: number;
        };
        Area: {
            id: number;
            nombre: string;
        } | null;
        id_area: number | null;
        id_rama: number | null;
        monto_actual: import("@prisma/client-runtime-utils").Decimal;
    }>;
    remove(req: AuthenticatedRequest, id: number): Promise<void>;
}
