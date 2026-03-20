import { Injectable } from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import {
  AuthenticatedScope,
  AuthenticatedUser,
} from '../types/auth-request.types';
import { hasUnrestrictedAccess } from '../utils/unrestricted-access.util';

type ScopedWhere<TWhere> = TWhere | Record<string, never>;

const BRANCH_SCOPE_ROLES = new Set(['JEFATURA_RAMA', 'AYUDANTE_RAMA']);
const AREA_SCOPE_ROLES = new Set(['SECRETARIA_TESORERIA', 'INTENDENCIA']);

const ADULT_ACCOUNT_SCOPE_ROLES = new Set([
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
]);

const ADULT_CUENTA_DINERO_READ_ROLES = new Set([
  'ADM',
  'DEV',
  'AYUDANTE',
  'JEFATURA',
  'SECRETARIA_TESORERIA',
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
  'OWN',
]);

@Injectable()
export class ScopeFilterService {
  forProtagonistas(
    user: AuthenticatedUser,
  ): ScopedWhere<Prisma.ProtagonistaWhereInput> {
    if (this.hasUnrestrictedAccess(user)) {
      return {};
    }

    return this.toWhereInput(this.buildProtagonistaFilters(user));
  }

  forAdultos(user: AuthenticatedUser): ScopedWhere<Prisma.AdultoWhereInput> {
    if (this.hasUnrestrictedAccess(user)) {
      return {};
    }

    return this.toWhereInput(this.buildAdultoFilters(user.scopes));
  }

  forResponsables(
    user: AuthenticatedUser,
  ): ScopedWhere<Prisma.ResponsableWhereInput> {
    if (this.hasUnrestrictedAccess(user)) {
      return {};
    }

    return this.toWhereInput(this.buildResponsableFilters(user));
  }

  forPagos(user: AuthenticatedUser): ScopedWhere<Prisma.PagoWhereInput> {
    if (this.hasUnrestrictedCuentaDineroAccess(user)) {
      return {};
    }

    const filters = this.buildPagoFilters(user);

    if (filters.length === 0) {
      return {
        id: -1,
      };
    }

    return this.toWhereInput(filters);
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

  forSabatinos(user: AuthenticatedUser): ScopedWhere<Prisma.SabatinoWhereInput> {
    if (this.hasUnrestrictedAccess(user)) {
      return {};
    }

    return this.toWhereInput(this.buildSabatinoFilters(user));
  }

  forCuentasDinero(
    user: AuthenticatedUser,
  ): ScopedWhere<Prisma.CuentaDineroWhereInput> {
    if (this.hasUnrestrictedCuentaDineroAccess(user)) {
      return {};
    }

    const groupCashFilter: Prisma.CuentaDineroWhereInput =
      this.hasAdultCuentaDineroReadAccess(user)
        ? {
            id_miembro: null,
            id_rama: null,
            Area: {
              nombre: 'Jefatura',
              borrado: false,
            },
          }
        : { id: -1 };

    const scopeFilters = this.buildCuentaDineroFilters(user);

    if (scopeFilters.length === 0) {
      return groupCashFilter;
    }

    return this.toWhereInput([groupCashFilter, ...scopeFilters]);
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
    return hasUnrestrictedAccess(user);
  }

  private hasUnrestrictedCuentaDineroAccess(user: AuthenticatedUser): boolean {
    return hasUnrestrictedAccess(user);
  }

  private hasAdultCuentaDineroReadAccess(user: AuthenticatedUser): boolean {
    return user.scopes.some((scope) =>
      ADULT_CUENTA_DINERO_READ_ROLES.has(scope.role),
    );
  }

  private buildProtagonistaFilters(
    user: AuthenticatedUser,
  ): Prisma.ProtagonistaWhereInput[] {
    const filters: Prisma.ProtagonistaWhereInput[] = [];

    for (const scope of user.scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (
        scope.scopeType === SCOPE.RAMA &&
        BRANCH_SCOPE_ROLES.has(scope.role)
      ) {
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

      if (scope.scopeType === SCOPE.AREA && AREA_SCOPE_ROLES.has(scope.role)) {
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

    if (user.roles.includes('RESPONSABLE')) {
      filters.push({
        Responsabilidad: {
          some: {
            borrado: false,
            Responsable: {
              borrado: false,
              Miembro: {
                borrado: false,
                id_cuenta: user.userId,
              },
            },
          },
        },
      });
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

  private buildResponsableFilters(
    user: AuthenticatedUser,
  ): Prisma.ResponsableWhereInput[] {
    const filters: Prisma.ResponsableWhereInput[] = [];

    for (const scope of user.scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (
        scope.scopeType === SCOPE.RAMA &&
        BRANCH_SCOPE_ROLES.has(scope.role)
      ) {
        filters.push({
          Responsabilidad: {
            some: {
              borrado: false,
              Protagonista: {
                borrado: false,
                Miembro: {
                  borrado: false,
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
        });
      }

      if (scope.scopeType === SCOPE.AREA && AREA_SCOPE_ROLES.has(scope.role)) {
        filters.push({
          Responsabilidad: {
            some: {
              borrado: false,
              Protagonista: {
                borrado: false,
                Miembro: {
                  borrado: false,
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
        });
      }
    }

    if (user.roles.includes('RESPONSABLE')) {
      filters.push({
        Responsabilidad: {
          some: {
            borrado: false,
            Protagonista: {
              borrado: false,
              Responsabilidad: {
                some: {
                  borrado: false,
                  Responsable: {
                    borrado: false,
                    Miembro: {
                      borrado: false,
                      id_cuenta: user.userId,
                    },
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

  private buildPagoFilters(user: AuthenticatedUser): Prisma.PagoWhereInput[] {
    const filters: Prisma.PagoWhereInput[] = [];

    for (const scope of user.scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (!ADULT_ACCOUNT_SCOPE_ROLES.has(scope.role)) {
        continue;
      }

      if (scope.scopeType === SCOPE.RAMA) {
        filters.push({
          Miembro: {
            borrado: false,
            OR: [
              {
                MiembroRama: {
                  some: {
                    id_rama: scope.scopeId,
                    borrado: false,
                    fecha_egreso: null,
                  },
                },
              },
              {
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
              {
                Responsable: {
                  is: {
                    borrado: false,
                    Responsabilidad: {
                      some: {
                        borrado: false,
                        Protagonista: {
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
                },
              },
            ],
          },
        });
      }

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          Miembro: {
            borrado: false,
            OR: [
              {
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
              {
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
              {
                Responsable: {
                  is: {
                    borrado: false,
                    Responsabilidad: {
                      some: {
                        borrado: false,
                        Protagonista: {
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
                },
              },
            ],
          },
        });
      }
    }

    if (user.roles.includes('PROTAGONISTA')) {
      filters.push({
        OR: [
          {
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
          },
          {
            Miembro: {
              borrado: false,
              Responsable: {
                is: {
                  borrado: false,
                  Responsabilidad: {
                    some: {
                      borrado: false,
                      Protagonista: {
                        borrado: false,
                        Miembro: {
                          id_cuenta: user.userId,
                          borrado: false,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (user.roles.includes('RESPONSABLE')) {
      filters.push({
        OR: [
          {
            Responsable: {
              id_cuenta: user.userId,
              borrado: false,
            },
          },
          {
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
          },
        ],
      });
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
                Responsable: {
                  is: {
                    borrado: false,
                    Responsabilidad: {
                      some: {
                        borrado: false,
                        Protagonista: {
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
                },
              },
            },
          ],
        });
      }
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

  private buildSabatinoFilters(
    user: AuthenticatedUser,
  ): Prisma.SabatinoWhereInput[] {
    const filters: Prisma.SabatinoWhereInput[] = [];

    for (const scope of user.scopes) {
      if (scope.scopeId == null) {
        continue;
      }

      if (scope.scopeType === SCOPE.RAMA) {
        filters.push({
          RamasAfectadas: {
            some: {
              id_rama: scope.scopeId,
            },
          },
        });
      }

      if (scope.scopeType === SCOPE.AREA) {
        filters.push({
          AreasAfectadas: {
            some: {
              id_area: scope.scopeId,
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
