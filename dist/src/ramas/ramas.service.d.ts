import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PrismaService } from '../prisma/prisma.service';
export declare class RamasService {
    private readonly prisma;
    private readonly scopeFilterService;
    constructor(prisma: PrismaService, scopeFilterService: ScopeFilterService);
    findAll(user: AuthenticatedUser): Promise<{
        id: number;
        nombre: string;
        id_area: number;
    }[]>;
}
