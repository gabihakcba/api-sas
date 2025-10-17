import { Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorManager } from 'src/utils/error.manager';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { CuentaService } from 'src/cuenta/cuenta.service';
type Tx = Prisma.TransactionClient;

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

  constructor(
    private readonly prismaService: PrismaService,
    private readonly cuentaService: CuentaService,
  ) {}

  async create(createMiembroDto: CreateMiembroDto): Promise<any> {
    // NO atrapes dentro si no vas a re-lanzar
    const miembro = await this.prismaService.$transaction(async (tx: Tx) => {
      // 1) separo la parte de cuenta del resto
      const { cuenta, fecha_nacimiento, id_rama, ...miembroInput } =
        createMiembroDto;

      // 2) creo la cuenta con el MISMO tx
      const nuevaCuenta = await this.cuentaService.create(tx, cuenta);

      // 3) creo el miembro con data explícito (sin `cuenta`)
      const created = await tx.miembro.create({
        data: {
          ...miembroInput, // solo campos reales del modelo Miembro
          fecha_nacimiento: new Date(fecha_nacimiento),
          Cuenta: { connect: { id: nuevaCuenta.id } },
          MiembroRama: { create: { id_rama } },
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
          MiembroRama: {
            include: { Rama: { select: { nombre: true } } },
          },
        },
      });

      return created;
    });

    const parsed = {
      ...miembro,
      rama: miembro.MiembroRama?.Rama?.nombre,
    };

    return parsed;
  }

  async findAll(): Promise<any> {
    try {
      const miembros = await this.prismaService.miembro.findMany({
        where: {
          borrado: false,
          Cuenta: {
            is: { borrado: false },
          },
        },
        select: {
          ...this.miembroSelect,
          MiembroRama: { select: { Rama: true } },
        },
      });
      const parsed = miembros.map((m) => {
        return {
          ...m,
          rama: m.MiembroRama?.Rama?.nombre,
        };
      });
      return parsed;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async findOne(id: number): Promise<any> {
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

  async update(id: number, updateMiembroDto: UpdateMiembroDto): Promise<any> {
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

  async remove(id: number): Promise<any> {
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
