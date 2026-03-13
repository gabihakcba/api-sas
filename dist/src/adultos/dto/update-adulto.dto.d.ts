import { SCOPE } from '@prisma/client';
export declare class UpdateAdultoDto {
    user?: string;
    password?: string;
    nombre?: string;
    apellidos?: string;
    dni?: string;
    fechaNacimiento?: Date;
    direccion?: string;
    email?: string;
    telefono?: string;
    telefonoEmergencia?: string;
    totem?: string;
    cualidad?: string;
    idArea?: number;
    idPosicion?: number;
    idRama?: number;
    fechaInicioEquipo?: Date;
    esBecado?: boolean;
    activo?: boolean;
    idRole?: number;
    tipoScope?: SCOPE;
    idScope?: number;
}
