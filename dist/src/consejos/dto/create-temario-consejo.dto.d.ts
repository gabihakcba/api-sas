import { ESTADO_TEMARIO } from '@prisma/client';
export declare class CreateTemarioConsejoDto {
    titulo: string;
    descripcion?: string;
    debate?: string;
    acuerdo?: string;
    sinMp?: boolean;
    estado?: ESTADO_TEMARIO;
}
