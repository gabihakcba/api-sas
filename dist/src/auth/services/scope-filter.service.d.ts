import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth-request.types';
type ScopedWhere<TWhere> = TWhere | Record<string, never>;
export declare class ScopeFilterService {
    forProtagonistas(user: AuthenticatedUser): ScopedWhere<Prisma.ProtagonistaWhereInput>;
    forAdultos(user: AuthenticatedUser): ScopedWhere<Prisma.AdultoWhereInput>;
    forPagos(user: AuthenticatedUser): ScopedWhere<Prisma.PagoWhereInput>;
    forRamas(user: AuthenticatedUser): ScopedWhere<Prisma.RamaWhereInput>;
    forAreas(user: AuthenticatedUser): ScopedWhere<Prisma.AreaWhereInput>;
    forCuentasDinero(user: AuthenticatedUser): ScopedWhere<Prisma.CuentaDineroWhereInput>;
    mergeWhere<TWhere extends object>(baseWhere: TWhere | undefined, scopeWhere: ScopedWhere<TWhere>): TWhere;
    private hasUnrestrictedAccess;
    private hasUnrestrictedCuentaDineroAccess;
    private buildProtagonistaFilters;
    private buildAdultoFilters;
    private buildPagoFilters;
    private buildCuentaDineroFilters;
    private buildCuentaDineroMemberProfileFilters;
    private buildRamaFilters;
    private buildAreaFilters;
    private toWhereInput;
}
export {};
