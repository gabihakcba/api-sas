import { Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ErrorManager } from 'src/utils/error.manager';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { CuentaService } from 'src/cuenta/cuenta.service';

type Tx = Prisma.TransactionClient;
type MiembroPrismaClient = Prisma.TransactionClient | PrismaClient;

const miembroSummarySelect = {
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
} as const;

type MiembroSummary = Prisma.MiembroGetPayload<{
  select: typeof miembroSummarySelect;
}>;

const miembroWithRamaSelect = {
  ...miembroSummarySelect,
  MiembroRama: { select: { Rama: true } },
} as const;

type MiembroWithRama = Prisma.MiembroGetPayload<{
  select: typeof miembroWithRamaSelect;
}>;

type MiembroWithRamaName = Omit<MiembroWithRama, 'MiembroRama'> & {
  rama?: string;
};

@Injectable()
export class MiembroService {
  constructor(private readonly cuentaService: CuentaService) {}

  async create(
    tx: Tx,
    createMiembroDto: CreateMiembroDto,
  ): Promise<MiembroWithRamaName> {
    const { cuenta, fecha_nacimiento, id_rama, ...miembroInput } =
      createMiembroDto;

    const nuevaCuenta = await this.cuentaService.create(tx, cuenta);

    const miembro = await tx.miembro.create({
      data: {
        ...miembroInput,
        fecha_nacimiento: new Date(fecha_nacimiento),
        Cuenta: { connect: { id: nuevaCuenta.id } },
        MiembroRama: { create: { id_rama } },
      },
      select: miembroWithRamaSelect,
    });

    return {
      ...miembro,
      rama: miembro.MiembroRama?.Rama?.nombre,
    };
  }

  async findAll(prisma: MiembroPrismaClient): Promise<MiembroWithRamaName[]> {
    try {
      const miembros = await prisma.miembro.findMany({
        where: {
          borrado: false,
          Cuenta: {
            is: { borrado: false },
          },
        },
        select: miembroWithRamaSelect,
      });

      return miembros.map((miembro) => ({
        ...miembro,
        rama: miembro.MiembroRama?.Rama?.nombre,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async findOne(
    prisma: MiembroPrismaClient,
    id: number,
  ): Promise<MiembroSummary> {
    try {
      const miembro = await prisma.miembro.findFirst({
        where: {
          id,
          borrado: false,
          Cuenta: {
            is: { borrado: false },
          },
        },
        select: miembroSummarySelect,
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
    prisma: MiembroPrismaClient,
    id: number,
    updateMiembroDto: UpdateMiembroDto,
  ): Promise<MiembroSummary> {
    try {
      const exists = await prisma.miembro.findFirst({
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

      const miembroActualizado = await prisma.miembro.update({
        where: { id },
        data,
        select: miembroSummarySelect,
      });

      return miembroActualizado;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async remove(
    prisma: MiembroPrismaClient,
    id: number,
  ): Promise<MiembroSummary> {
    try {
      const exists = await prisma.miembro.findFirst({
        where: { id, borrado: false },
        select: { id: true },
      });

      if (!exists) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Miembro no encontrado',
        });
      }

      const miembroBorrado = await prisma.miembro.update({
        where: { id },
        data: {
          borrado: true,
          Cuenta: {
            update: { borrado: true },
          },
        },
        select: miembroSummarySelect,
      });

      return miembroBorrado;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }
}
