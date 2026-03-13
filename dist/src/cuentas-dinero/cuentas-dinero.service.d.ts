import { Prisma } from '@prisma/client';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCuentaDineroDto } from './dto/create-cuenta-dinero.dto';
import { UpdateCuentaDineroDto } from './dto/update-cuenta-dinero.dto';
export declare class CuentasDineroService {
    private readonly prisma;
    private readonly scopeFilterService;
    constructor(prisma: PrismaService, scopeFilterService: ScopeFilterService);
    findAll(user: AuthenticatedUser, paginationQuery: PaginationQueryDto): Promise<{
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
            monto_actual: Prisma.Decimal;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOptions(user: AuthenticatedUser): Promise<{
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
    findOne(id: number, user: AuthenticatedUser): Promise<{
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
        monto_actual: Prisma.Decimal;
    }>;
    create(dto: CreateCuentaDineroDto, user: AuthenticatedUser): Promise<{
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
        monto_actual: Prisma.Decimal;
    }>;
    update(id: number, dto: UpdateCuentaDineroDto, user: AuthenticatedUser): Promise<{
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
        monto_actual: Prisma.Decimal;
    }>;
    remove(id: number, user: AuthenticatedUser): Promise<void>;
    private ensureUniqueName;
    private resolveAssignment;
    private validateScopedAccess;
}
