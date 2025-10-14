import { Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorManager } from 'src/utils/error.manager';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { MiembroWithCuenta } from './types/miembro-with-cuenta.type';

@Injectable()
export class MiembroService {
  private readonly miembroSelect: Prisma.MiembroSelect = {
    id: true,
    nombre: true,
    apellidos: true,
    dni: true,
    fecha_nacimiento: true,
    direccion: true,
    email: true,
    telefono: true,
    telefono_emergencia: true,
    totem: true,
    cualidad: true,
    borrado: true,
    createdAt: true,
    updatedAt: true,
    Cuenta: {
      select: {
        id: true,
        user: true,
        borrado: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  };

  constructor(private readonly prismaService: PrismaService) {}

  async create(createMiembroDto: CreateMiembroDto): Promise<MiembroWithCuenta> {
    try {
      const {
        cuenta,
        nombre,
        apellidos,
        dni,
        fecha_nacimiento,
        direccion,
        email,
        telefono,
        telefono_emergencia,
        totem,
        cualidad,
      } = createMiembroDto;

      const hashedPassword = await bcrypt.hash(
        cuenta.password,
        Number(process.env.HASH_SALT),
      );

      const miembro = await this.prismaService.miembro.create({
        data: {
          nombre,
          apellidos,
          dni,
          fecha_nacimiento: new Date(fecha_nacimiento),
          direccion,
          email,
          telefono,
          telefono_emergencia,
          totem,
          cualidad,
          Cuenta: {
            create: {
              user: cuenta.user,
              password: hashedPassword,
            },
          },
        },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
          fecha_nacimiento: true,
          direccion: true,
          email: true,
          telefono: true,
          telefono_emergencia: true,
          totem: true,
          cualidad: true,
          borrado: true,
          createdAt: true,
          updatedAt: true,
          Cuenta: {
            select: {
              id: true,
              user: true,
              borrado: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return miembro;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async findAll(): Promise<MiembroWithCuenta[]> {
    try {
      return await this.prismaService.miembro.findMany({
        where: {
          borrado: false,
          Cuenta: {
            is: { borrado: false },
          },
        },
        select: this.miembroSelect,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async findOne(id: number): Promise<MiembroWithCuenta> {
    try {
      const miembro = await this.prismaService.miembro.findFirst({
        where: {
          id,
          borrado: false,
          Cuenta: {
            is: { borrado: false },
          },
        },
        select: this.miembroSelect,
      });

      if (!miembro) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Miembro no encontrado',
        });
      }

      return miembro;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async update(
    id: number,
    updateMiembroDto: UpdateMiembroDto,
  ): Promise<MiembroWithCuenta> {
    try {
      const exists = await this.prismaService.miembro.findFirst({
        where: { id, borrado: false },
        select: { id: true },
      });

      if (!exists) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Miembro no encontrado',
        });
      }

      const plainUpdate = instanceToPlain(updateMiembroDto, {
        exposeUnsetFields: false,
      }) as UpdateMiembroDto;

      const { cuenta, ...miembroFields } = plainUpdate;

      const data: Prisma.MiembroUpdateInput =
        miembroFields as Prisma.MiembroUpdateInput;

      if (cuenta) {
        const plainCuenta = instanceToPlain(cuenta, {
          exposeUnsetFields: false,
        }) as UpdateMiembroDto['cuenta'];
        const cuentaData: Prisma.CuentaUpdateInput = {};

        if (plainCuenta?.user !== undefined) {
          cuentaData.user = plainCuenta.user;
        }

        if (plainCuenta?.password !== undefined) {
          cuentaData.password = await bcrypt.hash(
            plainCuenta.password,
            Number(process.env.HASH_SALT),
          );
        }

        if (Object.keys(cuentaData).length > 0) {
          data.Cuenta = { update: cuentaData };
        }
      }

      const miembroActualizado = await this.prismaService.miembro.update({
        where: { id },
        data,
        select: this.miembroSelect,
      });

      return miembroActualizado;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async remove(id: number): Promise<MiembroWithCuenta> {
    try {
      const exists = await this.prismaService.miembro.findFirst({
        where: { id, borrado: false },
        select: { id: true },
      });

      if (!exists) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Miembro no encontrado',
        });
      }

      const miembroBorrado = await this.prismaService.miembro.update({
        where: { id },
        data: {
          borrado: true,
          Cuenta: {
            update: { borrado: true },
          },
        },
        select: this.miembroSelect,
      });

      return miembroBorrado;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }
}
