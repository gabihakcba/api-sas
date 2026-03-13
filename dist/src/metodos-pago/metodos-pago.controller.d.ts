import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { MetodosPagoService } from './metodos-pago.service';
export declare class MetodosPagoController {
    private readonly metodosPagoService;
    constructor(metodosPagoService: MetodosPagoService);
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
}
