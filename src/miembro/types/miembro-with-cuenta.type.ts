import { Prisma } from '@prisma/client';

export type MiembroWithCuenta = Prisma.MiembroGetPayload<{
  select: {
    id: true;
    nombre: true;
    apellidos: true;
    dni: true;
    fecha_nacimiento: true;
    direccion: true;
    email: true;
    telefono: true;
    telefono_emergencia: true;
    totem: true;
    cualidad: true;
    borrado: true;
    createdAt: true;
    updatedAt: true;
    Cuenta: {
      select: {
        id: true;
        user: true;
        borrado: true;
        createdAt: true;
        updatedAt: true;
      };
    };
  };
}>;
