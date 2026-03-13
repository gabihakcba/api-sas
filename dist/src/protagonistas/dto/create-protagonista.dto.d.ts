import { CreateCuentaMiembroDto } from '../../cuentas/dto/create-cuenta-miembro.dto';
export declare class CreateProtagonistaDto extends CreateCuentaMiembroDto {
    idRama: number;
    fechaIngresoRama?: Date;
    esBecado?: boolean;
    activo?: boolean;
}
