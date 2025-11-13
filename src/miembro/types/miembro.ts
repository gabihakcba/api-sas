import { Cuenta } from 'src/cuenta/types/cuenta';

export type Miembro = {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: Date | string;
  direccion: string;
  email: string | null;
  telefono: string | null;
  telefono_emergencia: string;
  totem: string | null;
  cualidad: string | null;

  borrado: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  id_cuenta: number;

  Cuenta: Cuenta;
};
