"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopeFilterService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../decorators/roles.decorator");
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
let ScopeFilterService = class ScopeFilterService {
    forProtagonistas(user) {
        if (this.hasUnrestrictedAccess(user)) {
            return {};
        }
        return this.toWhereInput(this.buildProtagonistaFilters(user.scopes));
    }
    forAdultos(user) {
        if (this.hasUnrestrictedAccess(user)) {
            return {};
        }
        return this.toWhereInput(this.buildAdultoFilters(user.scopes));
    }
    forPagos(user) {
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
                    CuentaDinero: cuentasWhere,
                },
                {
                    CuentaOrigen: cuentasWhere,
                },
            ],
        };
    }
    forRamas(user) {
        if (this.hasUnrestrictedAccess(user)) {
            return {};
        }
        return this.toWhereInput(this.buildRamaFilters(user.scopes));
    }
    forAreas(user) {
        if (this.hasUnrestrictedAccess(user)) {
            return {};
        }
        return this.toWhereInput(this.buildAreaFilters(user.scopes));
    }
    forCuentasDinero(user) {
        if (this.hasUnrestrictedCuentaDineroAccess(user)) {
            return {};
        }
        const memberProfileWhere = this.buildCuentaDineroMemberProfileFilters(user);
        const scopeFilters = this.buildCuentaDineroFilters(user);
        if (memberProfileWhere.length === 0 && scopeFilters.length === 0) {
            return {
                id: -1,
            };
        }
        return this.toWhereInput([...scopeFilters, ...memberProfileWhere]);
    }
    mergeWhere(baseWhere, scopeWhere) {
        const hasBaseWhere = !!baseWhere && Object.keys(baseWhere).length > 0;
        const hasScopeWhere = Object.keys(scopeWhere).length > 0;
        if (!hasBaseWhere && !hasScopeWhere) {
            return {};
        }
        if (!hasBaseWhere) {
            return scopeWhere;
        }
        if (!hasScopeWhere) {
            return baseWhere;
        }
        return {
            AND: [baseWhere, scopeWhere],
        };
    }
    hasUnrestrictedAccess(user) {
        if (roles_decorator_1.BYPASS_ROLES.some((role) => user.roles.includes(role))) {
            return true;
        }
        return user.scopes.some((scope) => scope.scopeType === client_1.SCOPE.GLOBAL ||
            scope.scopeType === client_1.SCOPE.GRUPO ||
            scope.scopeType === client_1.SCOPE.OWN);
    }
    hasUnrestrictedCuentaDineroAccess(user) {
        return user.roles.some((role) => CUENTA_DINERO_FULL_ACCESS_ROLES.has(role));
    }
    buildProtagonistaFilters(scopes) {
        const filters = [];
        for (const scope of scopes) {
            if (scope.scopeId == null) {
                continue;
            }
            if (scope.scopeType === client_1.SCOPE.RAMA) {
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
            if (scope.scopeType === client_1.SCOPE.AREA) {
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
    buildAdultoFilters(scopes) {
        const filters = [];
        for (const scope of scopes) {
            if (scope.scopeId == null) {
                continue;
            }
            if (scope.scopeType === client_1.SCOPE.RAMA) {
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
            if (scope.scopeType === client_1.SCOPE.AREA) {
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
    buildPagoFilters(scopes) {
        const filters = [];
        for (const scope of scopes) {
            if (scope.scopeId == null) {
                continue;
            }
            if (scope.scopeType === client_1.SCOPE.RAMA) {
                filters.push({
                    CuentaDinero: {
                        id_rama: scope.scopeId,
                        borrado: false,
                    },
                });
            }
            if (scope.scopeType === client_1.SCOPE.AREA) {
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
    buildCuentaDineroFilters(user) {
        const filters = [];
        for (const scope of user.scopes) {
            if (scope.scopeId == null) {
                continue;
            }
            if (!ADULT_ACCOUNT_SCOPE_ROLES.has(scope.role)) {
                continue;
            }
            if (scope.scopeType === client_1.SCOPE.RAMA) {
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
            if (scope.scopeType === client_1.SCOPE.AREA) {
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
    buildCuentaDineroMemberProfileFilters(user) {
        const filters = [];
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
    buildRamaFilters(scopes) {
        const filters = [];
        for (const scope of scopes) {
            if (scope.scopeId == null) {
                continue;
            }
            if (scope.scopeType === client_1.SCOPE.RAMA) {
                filters.push({
                    id: scope.scopeId,
                });
            }
            if (scope.scopeType === client_1.SCOPE.AREA) {
                filters.push({
                    id_area: scope.scopeId,
                });
            }
        }
        return filters;
    }
    buildAreaFilters(scopes) {
        const filters = [];
        for (const scope of scopes) {
            if (scope.scopeId == null) {
                continue;
            }
            if (scope.scopeType === client_1.SCOPE.AREA) {
                filters.push({
                    id: scope.scopeId,
                });
            }
            if (scope.scopeType === client_1.SCOPE.RAMA) {
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
    toWhereInput(filters) {
        if (filters.length === 0) {
            return {};
        }
        if (filters.length === 1) {
            return filters[0];
        }
        return {
            OR: filters,
        };
    }
};
exports.ScopeFilterService = ScopeFilterService;
exports.ScopeFilterService = ScopeFilterService = __decorate([
    (0, common_1.Injectable)()
], ScopeFilterService);
//# sourceMappingURL=scope-filter.service.js.map