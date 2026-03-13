import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { AdultosService } from './adultos.service';
import { CreateAdultoDto } from './dto/create-adulto.dto';
import { UpdateAdultoDto } from './dto/update-adulto.dto';
export declare class AdultosController {
    private readonly adultosService;
    constructor(adultosService: AdultosService);
    findAll(req: AuthenticatedRequest, paginationQuery: PaginationQueryDto): Promise<{
        data: {
            id: number;
            EquipoArea: {
                Rama: {
                    id: number;
                    nombre: string;
                    id_area: number;
                } | null;
                id: number;
                Area: {
                    id: number;
                    nombre: string;
                };
                fecha_inicio: Date;
                Posicion: {
                    id: number;
                    nombre: string;
                };
            }[];
            Miembro: {
                id: number;
                nombre: string;
                Cuenta: {
                    id: number;
                    CuentaRole: {
                        id: number;
                        Role: {
                            id: number;
                            nombre: string;
                        };
                        tipo_scope: import(".prisma/client").$Enums.SCOPE;
                        id_scope: number | null;
                    }[];
                    user: string;
                };
                dni: string;
                email: string | null;
                apellidos: string;
                telefono: string | null;
            };
            es_becado: boolean;
            activo: boolean;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOptions(req: AuthenticatedRequest): Promise<{
        areas: {
            id: number;
            nombre: string;
        }[];
        posiciones: {
            id: number;
            nombre: string;
        }[];
        ramas: {
            id: number;
            nombre: string;
            id_area: number;
        }[];
        roles: {
            id: number;
            nombre: string;
        }[];
        scopes: ("GLOBAL" | "AREA" | "GRUPO" | "RAMA" | "OWN")[];
    }>;
    findOne(req: AuthenticatedRequest, id: number): Promise<{
        id: number;
        EquipoArea: {
            Rama: {
                id: number;
                nombre: string;
                id_area: number;
            } | null;
            id: number;
            Area: {
                id: number;
                nombre: string;
            };
            id_area: number;
            id_rama: number | null;
            fecha_inicio: Date;
            id_posicion: number;
            Posicion: {
                id: number;
                nombre: string;
            };
        }[];
        Miembro: {
            id: number;
            nombre: string;
            Cuenta: {
                id: number;
                CuentaRole: {
                    id: number;
                    Role: {
                        id: number;
                        nombre: string;
                    };
                    tipo_scope: import(".prisma/client").$Enums.SCOPE;
                    id_scope: number | null;
                }[];
                user: string;
            };
            dni: string;
            email: string | null;
            apellidos: string;
            fecha_nacimiento: Date;
            direccion: string;
            telefono: string | null;
            telefono_emergencia: string;
            totem: string | null;
            cualidad: string | null;
        };
        es_becado: boolean;
        activo: boolean;
    }>;
    create(dto: CreateAdultoDto): Promise<{
        cuenta: {
            id: number;
            user: string;
        };
        miembro: {
            id: number;
            nombre: string;
            apellidos: string;
            dni: string;
        };
        adulto: {
            id: number;
            es_becado: boolean;
            activo: boolean;
        };
        area: {
            id: number;
            nombre: string;
        };
        posicion: {
            id: number;
            nombre: string;
        };
        rama: {
            id: number;
            nombre: string;
            id_area: number;
        } | null;
        equipoArea: {
            id: number;
            activo: boolean;
            fecha_inicio: Date;
        };
        cuentaRole: {
            id: number;
            role: string;
            scopeType: import(".prisma/client").$Enums.SCOPE;
            scopeId: number | null;
        } | null;
    }>;
    update(id: number, dto: UpdateAdultoDto, req: AuthenticatedRequest): Promise<{
        id: number;
        EquipoArea: {
            Rama: {
                id: number;
                nombre: string;
                id_area: number;
            } | null;
            id: number;
            Area: {
                id: number;
                nombre: string;
            };
            id_area: number;
            id_rama: number | null;
            fecha_inicio: Date;
            id_posicion: number;
            Posicion: {
                id: number;
                nombre: string;
            };
        }[];
        Miembro: {
            id: number;
            nombre: string;
            Cuenta: {
                id: number;
                CuentaRole: {
                    id: number;
                    Role: {
                        id: number;
                        nombre: string;
                    };
                    tipo_scope: import(".prisma/client").$Enums.SCOPE;
                    id_scope: number | null;
                }[];
                user: string;
            };
            dni: string;
            email: string | null;
            apellidos: string;
            fecha_nacimiento: Date;
            direccion: string;
            telefono: string | null;
            telefono_emergencia: string;
            totem: string | null;
            cualidad: string | null;
        };
        es_becado: boolean;
        activo: boolean;
    }>;
    remove(id: number, req: AuthenticatedRequest): Promise<void>;
}
