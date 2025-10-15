import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthAccountContext } from 'src/auth/interfaces/auth-account-context.interface';
import { ErrorManager } from '../utils/error.manager';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';

type CuentaPrismaClient = Prisma.TransactionClient | PrismaClient;

const cuentaSummarySelect = {
  id: true,
  user: true,
  borrado: true,
  createdAt: true,
  updatedAt: true,
} as const;

type CuentaSummary = Prisma.CuentaGetPayload<{ select: typeof cuentaSummarySelect }>;

const cuentaWithRolesSelect = {
  ...cuentaSummarySelect,
  CuentaRole: {
    include: {
      Role: true,
    },
  },
} as const;

type CuentaWithRoles = Prisma.CuentaGetPayload<{
  select: typeof cuentaWithRolesSelect;
}>;

@Injectable()
export class CuentaService {
  async create(
    prisma: CuentaPrismaClient,
    createCuentaDto: CreateCuentaDto,
  ): Promise<CuentaSummary> {
    try {
      const { user, password } = createCuentaDto;
      const hashedPassword = await bcrypt.hash(
        password,
        Number(process.env.HASH_SALT),
      );

      const cuenta = await prisma.cuenta.create({
        data: { user, password: hashedPassword },
        select: cuentaSummarySelect,
      });

      if (!cuenta) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'Error creando cuenta',
        });
      }

      return cuenta;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async findAll(prisma: CuentaPrismaClient): Promise<CuentaSummary[]> {
    try {
      return await prisma.cuenta.findMany({
        select: cuentaSummarySelect,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async findById(prisma: CuentaPrismaClient, id: number): Promise<CuentaWithRoles> {
    try {
      const cuenta = await prisma.cuenta.findUnique({
        where: { id },
        select: cuentaWithRolesSelect,
      });

      if (!cuenta) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'Cuenta no encontrada',
        });
      }

      return cuenta;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async buildAuthAccountContext(
    prisma: CuentaPrismaClient,
    id: number,
  ): Promise<AuthAccountContext | null> {
    const cuenta = await prisma.cuenta.findUnique({
      where: { id },
      select: {
        id: true,
        Miembro: {
          select: {
            id: true,
            Protagonista: {
              select: {
                id: true,
              },
            },
            Responsable: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!cuenta) {
      return null;
    }

    const dependents: AuthAccountContext['dependents'] = [];
    const responsableId = cuenta.Miembro?.Responsable?.id;

    if (typeof responsableId === 'number') {
      const responsabilidades = await prisma.responsabilidad.findMany({
        where: { id_responsable: responsableId },
        select: {
          Protagonista: {
            select: {
              id: true,
              Miembro: {
                select: {
                  id: true,
                  id_cuenta: true,
                },
              },
            },
          },
        },
      });

      for (const responsabilidad of responsabilidades) {
        const protagonista = responsabilidad.Protagonista;
        const miembro = protagonista?.Miembro;

        if (
          protagonista &&
          miembro &&
          typeof miembro.id === 'number' &&
          typeof miembro.id_cuenta === 'number'
        ) {
          dependents.push({
            cuentaId: miembro.id_cuenta,
            miembroId: miembro.id,
            protagonistaId: protagonista.id,
          });
        }
      }
    }

    return {
      cuentaId: cuenta.id,
      miembroId: cuenta.Miembro?.id ?? undefined,
      protagonistaId: cuenta.Miembro?.Protagonista?.id ?? undefined,
      responsableId: responsableId ?? undefined,
      dependents,
    };
  }

  async findByUser(
    prisma: CuentaPrismaClient,
    user: string,
    withPassword: boolean,
  ) {
    try {
      return await prisma.cuenta.findUnique({
        where: { user },
        select: {
          ...cuentaSummarySelect,
          ...(withPassword ? { password: true } : {}),
          Miembro: {
            select: {
              nombre: true,
              apellidos: true,
              dni: true,
            },
          },
          CuentaRole: {
            select: {
              id: true,
              id_cuenta: true,
              id_role: true,
              Role: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async update(
    prisma: CuentaPrismaClient,
    id: number,
    updateCuentaDto: UpdateCuentaDto,
  ): Promise<CuentaSummary> {
    try {
      const data: Prisma.CuentaUpdateInput = {};

      if (updateCuentaDto.user !== undefined) {
        data.user = updateCuentaDto.user;
      }

      if (updateCuentaDto.password !== undefined) {
        data.password = await bcrypt.hash(
          updateCuentaDto.password,
          Number(process.env.HASH_SALT),
        );
      }

      if (Object.keys(data).length === 0) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No hay campos para actualizar',
        });
      }

      const cuenta = await prisma.cuenta.update({
        where: { id },
        data,
        select: cuentaSummarySelect,
      });

      return cuenta;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async remove(prisma: CuentaPrismaClient, id: number): Promise<CuentaSummary> {
    try {
      const cuenta = await prisma.cuenta.delete({
        where: { id },
        select: cuentaSummarySelect,
      });

      return cuenta;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }
}
