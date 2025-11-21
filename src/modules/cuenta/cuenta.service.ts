import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthAccountContext } from 'src/modules/auth/interfaces/auth-account-context.interface';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { Tx } from 'src/modules/prisma/types/prisma';
import { Cuenta, CuentaWithRole } from './types/cuenta';

@Injectable()
export class CuentaService {
  private readonly hashSalt: number;

  constructor(private readonly configService: ConfigService) {
    this.hashSalt = this.configService.get<number>('HASH_SALT') ?? 10;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.hashSalt);
  }

  async create(tx: Tx, createCuentaDto: CreateCuentaDto): Promise<Cuenta> {
    try {
      const { user, password } = createCuentaDto;
      const hashedPassword = await this.hashPassword(password);

      const cuenta = await tx.cuenta.create({
        data: { user, password: hashedPassword },
      });

      return cuenta;
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async findAll(prisma: Tx): Promise<Cuenta[]> {
    try {
      return await prisma.cuenta.findMany({});
    } catch (error: unknown) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async findById(prisma: Tx, id: number): Promise<CuentaWithRole> {
    try {
      const cuenta = await prisma.cuenta.findUnique({
        where: { id },
        select: {
          id: true,
          user: true,
          password: true,
          CuentaRole: {
            select: {
              id: true,
              createdAt: true,
              id_cuenta: true,
              id_role: true,
              Role: {
                select: {
                  id: true,
                  nombre: true,
                  descripcion: true,
                },
              },
            },
          },
        },
      });

      if (!cuenta) {
        throw new Error(JSON.stringify('Cuenta no encontrada'));
      }

      return cuenta;
    } catch (error: unknown) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async buildAuthAccountContext(
    prisma: Tx,
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

  async findByUser(prisma: Tx, user: string, withPassword: boolean) {
    try {
      return await prisma.cuenta.findUnique({
        where: { user },
        select: {
          id: true,
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
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async update(
    prisma: Tx,
    id: number,
    updateCuentaDto: UpdateCuentaDto,
  ): Promise<Cuenta> {
    try {
      const data: Prisma.CuentaUpdateInput = {};

      if (updateCuentaDto.user !== undefined) {
        data.user = updateCuentaDto.user;
      }

      if (updateCuentaDto.password !== undefined) {
        data.password = await this.hashPassword(updateCuentaDto.password);
      }

      if (Object.keys(data).length === 0) {
        throw new Error(JSON.stringify('No hay campos para actualizar'));
      }

      const cuenta = await prisma.cuenta.update({
        where: { id },
        data,
      });

      return cuenta;
    } catch (error: unknown) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async remove(prisma: Tx, id: number): Promise<Cuenta> {
    try {
      const cuenta = await prisma.cuenta.delete({
        where: { id },
      });

      return cuenta;
    } catch (error: unknown) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
}
