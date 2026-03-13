import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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

@Injectable()
export class CuentasService {
  async createCuentaConMiembro(
    tx: Prisma.TransactionClient,
    dto: CreateCuentaMiembroDto,
  ): Promise<CuentaMiembroCreado> {
    const existingUser = await tx.cuenta.findUnique({
      where: { user: dto.user },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con ese usuario.');
    }

    const existingDni = await tx.miembro.findUnique({
      where: { dni: dto.dni },
      select: { id: true },
    });

    if (existingDni) {
      throw new ConflictException('Ya existe un miembro con ese DNI.');
    }

    if (dto.email) {
      const existingEmail = await tx.miembro.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (existingEmail) {
        throw new ConflictException('Ya existe un miembro con ese email.');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const cuenta = await tx.cuenta.create({
      data: {
        user: dto.user,
        password: hashedPassword,
      },
      select: {
        id: true,
        user: true,
      },
    });

    const miembro = await tx.miembro.create({
      data: {
        nombre: dto.nombre,
        apellidos: dto.apellidos,
        dni: dto.dni,
        fecha_nacimiento: dto.fechaNacimiento,
        direccion: dto.direccion,
        email: dto.email,
        telefono: dto.telefono,
        telefono_emergencia: dto.telefonoEmergencia,
        totem: dto.totem,
        cualidad: dto.cualidad,
        id_cuenta: cuenta.id,
      },
      select: {
        id: true,
      },
    });

    return {
      cuentaId: cuenta.id,
      miembroId: miembro.id,
      user: cuenta.user,
    };
  }

  async updateCuentaConMiembro(
    tx: Prisma.TransactionClient,
    identifiers: {
      cuentaId: number;
      miembroId: number;
    },
    dto: UpdateCuentaMiembroDto,
  ): Promise<void> {
    if (dto.user) {
      const existingUser = await tx.cuenta.findFirst({
        where: {
          user: dto.user,
          NOT: {
            id: identifiers.cuentaId,
          },
        },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictException('Ya existe una cuenta con ese usuario.');
      }
    }

    if (dto.dni) {
      const existingDni = await tx.miembro.findFirst({
        where: {
          dni: dto.dni,
          NOT: {
            id: identifiers.miembroId,
          },
        },
        select: { id: true },
      });

      if (existingDni) {
        throw new ConflictException('Ya existe un miembro con ese DNI.');
      }
    }

    if (dto.email) {
      const existingEmail = await tx.miembro.findFirst({
        where: {
          email: dto.email,
          NOT: {
            id: identifiers.miembroId,
          },
        },
        select: { id: true },
      });

      if (existingEmail) {
        throw new ConflictException('Ya existe un miembro con ese email.');
      }
    }

    const cuentaData: Prisma.CuentaUpdateInput = {};
    if (dto.user !== undefined) {
      cuentaData.user = dto.user;
    }
    if (dto.password) {
      cuentaData.password = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(cuentaData).length > 0) {
      await tx.cuenta.update({
        where: { id: identifiers.cuentaId },
        data: cuentaData,
      });
    }

    const miembroData: Prisma.MiembroUpdateInput = {};
    if (dto.nombre !== undefined) {
      miembroData.nombre = dto.nombre;
    }
    if (dto.apellidos !== undefined) {
      miembroData.apellidos = dto.apellidos;
    }
    if (dto.dni !== undefined) {
      miembroData.dni = dto.dni;
    }
    if (dto.fechaNacimiento !== undefined) {
      miembroData.fecha_nacimiento = dto.fechaNacimiento;
    }
    if (dto.direccion !== undefined) {
      miembroData.direccion = dto.direccion;
    }
    if (dto.email !== undefined) {
      miembroData.email = dto.email;
    }
    if (dto.telefono !== undefined) {
      miembroData.telefono = dto.telefono;
    }
    if (dto.telefonoEmergencia !== undefined) {
      miembroData.telefono_emergencia = dto.telefonoEmergencia;
    }
    if (dto.totem !== undefined) {
      miembroData.totem = dto.totem;
    }
    if (dto.cualidad !== undefined) {
      miembroData.cualidad = dto.cualidad;
    }

    if (Object.keys(miembroData).length > 0) {
      await tx.miembro.update({
        where: { id: identifiers.miembroId },
        data: miembroData,
      });
    }
  }
}
