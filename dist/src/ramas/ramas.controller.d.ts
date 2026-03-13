import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { RamasService } from './ramas.service';
export declare class RamasController {
    private readonly ramasService;
    constructor(ramasService: RamasService);
    findAll(req: AuthenticatedRequest): Promise<{
        id: number;
        nombre: string;
        id_area: number;
    }[]>;
}
