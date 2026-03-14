import { Injectable } from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { BYPASS_ROLES } from '../decorators/roles.decorator';
import {
  AuthenticatedScope,
  AuthenticatedUser,
} from '../types/auth-request.types';

type ScopedWhere<TWhere> = TWhere | Record<string, never>;

const CUENTA_DINERO_FULL_ACCESS_ROLES = new Set([
  'ADM',
  'OWN',
  'JEFATURA',
  'SECRETARIA_TESORERIA',
]);

const ADULT_ACCOUNT_SCOPE_ROLES = new Set([
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
]);

@Injectable()
export class ScopeFilterService {
  forProtagonistas(
    user: AuthenticatedUser,
  ): ScopedWhere<Prisma.ProtagonistaWhereInput> {
    if (this.hasUnrestrictedAccess(user)) {
      return {};
    }

    return this.toWhereInput(this.buildProtagonistaFilters(user.scopes));
  }

  forAdultos(user: AuthenticatedUser): ScopedWhere<Prisma.AdultoWhereInput> {
    if (this.hasUnrestrictedAccess(user)) {
      return {};
    }

    return this.toWhereInput(this.buildAdultoFilters(user.scopes));
  }

  forPagos(user: AuthenticatedUser): ScopedWhere<Prisma.PagoWhereInput> {
    if (this.hasUnrestrictedCuentaDineroAccess(user)) {
      return {};
    }

    const cuentasWhere = this.forCuentasDinero(user);

    if (Object.keys(cuentasWhere).length === 0) {
      return {};
    }

    return {
      OR: [
        {
          CuentaDinero: cuentasWhere as Prisma.CuentaDineroWhereInput,
        },
        {
          CuentaOrigen: cuentasWhere as Prisma.CuentaDineroWhereInput,
        },
      ],
    };
  }

  forRamas(user: AuthenticatedUser): ScopedWhere<Prisma.RamaWhereInput> {
    if (this.hasUnrestrictedAccess(user)) {
      return {};
    }

    return this.toWhereInput(this.buildRamaFilters(user.scopes));
  }

  forAreas(user: AuthenticatedUser): ScopedWhere<Prisma.AreaWhereInput> {
    if (this.hasUnrestrictedAccess(user)) {
      return {};
    }

    return this.toWhereInput(this.buildAreaFilters(user.scopes));
  }

  forCuentasDinero(
    user: AuthenticatedUser,
  ): ScopedWhere<Prisma.CuentaDineroWhereInput> {
    if (this.hasUnrestrictedCuentaDineroAccess(user)) {
      return {};
    }

    const groupCashFilter: Prisma.CuentaDineroWhereInput = {
      id_miembro: null,
      id_rama: null,
      Area: {
        nombre: 'Jefatura',
        borrado: false,
      },
    };

    const memberProfileWhere = this.buildCuentaDineroMemberProfileFilters(user);
    const scopeFilters = this.buildCuentaDineroFilters(user);

    return this.toWhereInput([
      groupCashFilter,
      ...scopeFilters,
      ...memberProfileWhere,
    ]);
  }

  mergeWhere<TWhere extends object>(
    baseWhere: TWhere | undefined,
    scopeWhere: ScopedWhere<TWhere>,
  ): TWhere {
    const hasBaseWhere = !!baseWhere && Object.keys(baseWhere).length > 0;
    const hasScopeWhere = Object.keys(scopeWhere).length > 0;

    if (!hasBaseWhere && !hasScopeWhere) {
      return {} as TWhere;
    }

    if (!hasBaseWhere) {
      return scopeWhere as TWhere;
    }

    if (!hasScopeWhere) {
      return baseWhere;
    }

    return {
      AND: [baseWhere, scopeWhere],
    } as TWhere;
  }

  private hasUnrestrictedAccess(user: AuthenticatedUser): boolean {
    if (BYPASS_ROLES.some((role) => user.roles.includes(role))) {
      return true;
    }

    return user.scopes.some(
      (scope) =>
        scope.scopeType === SCOPE.GLOBAL ||
        scope.scopeType === SCOPE.GRUPO ||
        scope.scopeType === SCOPE.OWN,
    );
  }

  private hasUnrestrictedCuentaDineroAccess(user: AuthenticatedUser): boolean {
    return user.roles.some((role) => CUENTA_DINERO_FULL_ACCESS_ROLES.has(role));
  }

  private buildProtagonistaFilters(
    scopes: AuthenticatedScope[],
  ): Prisma.ProtagonistaWhereInput[] {
    const filters: Prisma.ProtagonistaWhereInput[] = [];

    for (const scope of scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (scope.scopeType === SCOPE.RAMA) {
        filters.push({
          Miembro: {
            MiembroRama: {
              some: {
                id_rama: scope.scopeId,
                borrado: false,
                fecha_egreso: null,
              },
            },
          },
        });
      }

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          Miembro: {
            MiembroRama: {
              some: {
                borrado: false,
                fecha_egreso: null,
                Rama: {
                  id_area: scope.scopeId,
                  borrado: false,
                },
              },
            },
          },
        });
      }
    }

    return filters;
  }

  private buildAdultoFilters(
    scopes: AuthenticatedScope[],
  ): Prisma.AdultoWhereInput[] {
    const filters: Prisma.AdultoWhereInput[] = [];

    for (const scope of scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (scope.scopeType === SCOPE.RAMA) {
        filters.push({
          EquipoArea: {
            some: {
              id_rama: scope.scopeId,
              borrado: false,
              activo: true,
              fecha_fin: null,
            },
          },
        });
      }

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          EquipoArea: {
            some: {
              borrado: false,
              activo: true,
              fecha_fin: null,
              OR: [
                { id_area: scope.scopeId },
                {
                  Rama: {
                    id_area: scope.scopeId,
                    borrado: false,
                  },
                },
              ],
            },
          },
        });
      }
    }

    return filters;
  }

  private buildPagoFilters(
    scopes: AuthenticatedScope[],
  ): Prisma.PagoWhereInput[] {
    const filters: Prisma.PagoWhereInput[] = [];

    for (const scope of scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (scope.scopeType === SCOPE.RAMA) {
        filters.push({
          CuentaDinero: {
            id_rama: scope.scopeId,
            borrado: false,
          },
        });
      }

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          CuentaDinero: {
            borrado: false,
            OR: [
              { id_area: scope.scopeId },
              {
                Rama: {
                  id_area: scope.scopeId,
                  borrado: false,
                },
              },
            ],
          },
        });
      }
    }

    return filters;
  }

  private buildCuentaDineroFilters(
    user: AuthenticatedUser,
  ): Prisma.CuentaDineroWhereInput[] {
    const filters: Prisma.CuentaDineroWhereInput[] = [];

    for (const scope of user.scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (!ADULT_ACCOUNT_SCOPE_ROLES.has(scope.role)) {
        continue;
      }

      if (scope.scopeType === SCOPE.RAMA) {
        filters.push({
          OR: [
            {
              id_rama: scope.scopeId,
            },
            {
              Miembro: {
                Protagonista: {
                  is: {
                    borrado: false,
                    Miembro: {
                      MiembroRama: {
                        some: {
                          id_rama: scope.scopeId,
                          borrado: false,
                          fecha_egreso: null,
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              Miembro: {
                Adulto: {
                  is: {
                    borrado: false,
                    activo: true,
                    EquipoArea: {
                      some: {
                        id_rama: scope.scopeId,
                        borrado: false,
                        activo: true,
                        fecha_fin: null,
                      },
                    },
                  },
                },
              },
            },
          ],
        });
      }

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          OR: [
            { id_area: scope.scopeId },
            {
              Rama: {
                id_area: scope.scopeId,
                borrado: false,
              },
            },
            {
              Miembro: {
                Protagonista: {
                  is: {
                    borrado: false,
                    Miembro: {
                      MiembroRama: {
                        some: {
                          borrado: false,
                          fecha_egreso: null,
                          Rama: {
                            id_area: scope.scopeId,
                            borrado: false,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              Miembro: {
                Adulto: {
                  is: {
                    borrado: false,
                    activo: true,
                    EquipoArea: {
                      some: {
                        borrado: false,
                        activo: true,
                        fecha_fin: null,
                        OR: [
                          { id_area: scope.scopeId },
                          {
                            Rama: {
                              id_area: scope.scopeId,
                              borrado: false,
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          ],
        });
      }
    }

    return filters;
  }

  private buildCuentaDineroMemberProfileFilters(
    user: AuthenticatedUser,
  ): Prisma.CuentaDineroWhereInput[] {
    const filters: Prisma.CuentaDineroWhereInput[] = [];

    if (user.roles.includes('PROTAGONISTA')) {
      filters.push({
        Miembro: {
          id_cuenta: user.userId,
          borrado: false,
          Protagonista: {
            is: {
              borrado: false,
              activo: true,
            },
          },
        },
      });

      filters.push({
        Rama: {
          MiembroRama: {
            some: {
              borrado: false,
              fecha_egreso: null,
              Miembro: {
                borrado: false,
                id_cuenta: user.userId,
                Protagonista: {
                  is: {
                    borrado: false,
                    activo: true,
                  },
                },
              },
            },
          },
        },
      });
    }

    if (user.roles.includes('RESPONSABLE')) {
      filters.push({
        Miembro: {
          borrado: false,
          Protagonista: {
            is: {
              borrado: false,
              Responsabilidad: {
                some: {
                  borrado: false,
                  Responsable: {
                    Miembro: {
                      id_cuenta: user.userId,
                      borrado: false,
                    },
                    borrado: false,
                  },
                },
              },
            },
          },
        },
      });
    }

    return filters;
  }

  private buildRamaFilters(
    scopes: AuthenticatedScope[],
  ): Prisma.RamaWhereInput[] {
    const filters: Prisma.RamaWhereInput[] = [];

    for (const scope of scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (scope.scopeType === SCOPE.RAMA) {
        filters.push({
          id: scope.scopeId,
        });
      }

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          id_area: scope.scopeId,
        });
      }
    }

    return filters;
  }

  private buildAreaFilters(
    scopes: AuthenticatedScope[],
  ): Prisma.AreaWhereInput[] {
    const filters: Prisma.AreaWhereInput[] = [];

    for (const scope of scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          id: scope.scopeId,
        });
      }

      if (scope.scopeType === SCOPE.RAMA) {
        filters.push({
          Rama: {
            some: {
              id: scope.scopeId,
              borrado: false,
            },
          },
        });
      }
    }

    return filters;
  }

  private toWhereInput<TWhere extends object>(
    filters: TWhere[],
  ): ScopedWhere<TWhere> {
    if (filters.length === 0) {
      return {};
    }

    if (filters.length === 1) {
      return filters[0];
    }

    return {
      OR: filters,
    } as TWhere;
  }
}
