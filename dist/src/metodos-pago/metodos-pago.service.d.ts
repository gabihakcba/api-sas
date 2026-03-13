import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
export declare class MetodosPagoService {
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
    create(dto: CreateMetodoPagoDto): Promise<{
        id: number;
        nombre: string;
        descripcion: string | null;
        _count: {
            Pago: number;
        };
    }>;
    update(id: number, dto: UpdateMetodoPagoDto): Promise<{
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
