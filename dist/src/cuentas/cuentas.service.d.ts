import { Prisma } from '@prisma/client';
import { CreateCuentaMiembroDto } from './dto/create-cuenta-miembro.dto';
export interface CuentaMiembroCreado {
    cuentaId: number;
    miembroId: number;
    user: string;
}
export interface UpdateCuentaMiembroDto {
    user?: string;
    password?: string;
    nombre?: string;
    apellidos?: string;
    dni?: string;
    fechaNacimiento?: Date;
    direccion?: string;
    email?: string | null;
    telefono?: string | null;
    telefonoEmergencia?: string;
    totem?: string | null;
    cualidad?: string | null;
}
export declare class CuentasService {
    createCuentaConMiembro(tx: Prisma.TransactionClient, dto: CreateCuentaMiembroDto): Promise<CuentaMiembroCreado>;
    updateCuentaConMiembro(tx: Prisma.TransactionClient, identifiers: {
        cuentaId: number;
        miembroId: number;
    }, dto: UpdateCuentaMiembroDto): Promise<void>;
}
