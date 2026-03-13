import { SCOPE } from '@prisma/client';
import { CreateCuentaMiembroDto } from '../../cuentas/dto/create-cuenta-miembro.dto';
export declare class CreateAdultoDto extends CreateCuentaMiembroDto {
    idArea: number;
    idPosicion: number;
    idRama?: number;
    fechaInicioEquipo?: Date;
    esBecado?: boolean;
    activo?: boolean;
    idRole?: number;
    tipoScope?: SCOPE;
    idScope?: number;
}
