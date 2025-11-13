import { Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { CuentaService } from 'src/cuenta/cuenta.service';
import { Miembro } from './types/miembro';

type Tx = Prisma.TransactionClient;

@Injectable()
export class MiembroService {
  constructor(private readonly cuentaService: CuentaService) {}

  async create(tx: Tx, createMiembroDto: CreateMiembroDto): Promise<Miembro> {
    const nuevaCuenta = await this.cuentaService.create(tx, {
      user: createMiembroDto.dni,
      password: createMiembroDto.dni,
    });

    const miembro = await tx.miembro.create({
      data: {
        ...createMiembroDto,
        Cuenta: { connect: { id: nuevaCuenta.id } },
      },
      include: {
        Cuenta: true,
      },
    });

    return miembro;
  }

  async findAll(prisma: Tx): Promise<any[]> {
    try {
      const miembros = await prisma.miembro.findMany({
        where: {
          borrado: false,
          Cuenta: {
            is: { borrado: false },
          },
        },
      });

      return miembros;
    } catch (error: unknown) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async findOne(prisma: Tx, id: number): Promise<any> {
    try {
      const miembro = await prisma.miembro.findFirst({
        where: {
          id,
          borrado: false,
          Cuenta: {
            is: { borrado: false },
          },
        },
      });

      if (!miembro) {
        throw new Error(JSON.stringify('Miembro no encontrado'));
      }

      return miembro;
    } catch (error: unknown) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async update(
    prisma: Tx,
    id: number,
    updateMiembroDto: UpdateMiembroDto,
  ): Promise<any> {
    try {
      const exists = await prisma.miembro.findFirst({
        where: { id, borrado: false },
        select: { id: true },
      });

      if (!exists) {
        throw new Error(JSON.stringify('Miembro no encontrado'));
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
      });

      return miembroActualizado;
    } catch (error: unknown) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async remove(prisma: Tx, id: number): Promise<any> {
    try {
      const exists = await prisma.miembro.findFirst({
        where: { id, borrado: false },
        select: { id: true },
      });

      if (!exists) {
        throw new Error(JSON.stringify('Miembro no encontrado'));
      }

      const miembroBorrado = await prisma.miembro.update({
        where: { id },
        data: {
          borrado: true,
          Cuenta: {
            update: { borrado: true },
          },
        },
      });

      return miembroBorrado;
    } catch (error: unknown) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
}
