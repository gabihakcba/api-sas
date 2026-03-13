import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConceptoPagoDto } from './dto/create-concepto-pago.dto';
import { UpdateConceptoPagoDto } from './dto/update-concepto-pago.dto';
export declare class ConceptosPagoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(paginationQuery: PaginationQueryDto): Promise<{
        data: {
            id: number;
            nombre: string;
            descripcion: string | null;
            _count: {
                Pago: number;
            };
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<{
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            Pago: number;
        };
    }>;
    create(dto: CreateConceptoPagoDto): Promise<{
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            Pago: number;
        };
    }>;
    update(id: number, dto: UpdateConceptoPagoDto): Promise<{
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            Pago: number;
        };
    }>;
    remove(id: number): Promise<void>;
    private ensureExists;
}
