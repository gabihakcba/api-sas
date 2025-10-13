import { Injectable } from '@nestjs/common';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorManager } from '../utils/error.manager';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CuentaService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCuentaDto: CreateCuentaDto): Promise<UpdateCuentaDto> {
    try {
      const { user, password } = createCuentaDto;
      const hashedPassword = await bcrypt.hash(
        password,
        Number(process.env.HASH_SALT),
      );
      const cuenta = await this.prismaService.cuenta.create({
        data: { user, password: hashedPassword },
        // no devolver password
        select: {
          id: true,
          user: true,
          borrado: true,
          createdAt: true,
          updatedAt: true,
        },
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

  async findAll(): Promise<UpdateCuentaDto[]> {
    try {
      const cuentas = await this.prismaService.cuenta.findMany({
        select: {
          id: true,
          user: true,
          borrado: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return cuentas;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async findById(id: number) {
    try {
      const cuenta = await this.prismaService.cuenta.findUnique({
        where: { id },
        select: {
          id: true,
          user: true,
          borrado: true,
          createdAt: true,
          updatedAt: true,
          CuentaRole: {
            include: {
              Role: true,
            },
          },
        },
      });
      if (!cuenta) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'Cuenta no encontrada',
        });
      }
      return cuenta;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  async findByUser(user: string, withPassword: boolean) {
    try {
      const cuenta = await this.prismaService.cuenta.findUnique({
        where: { user },
        select: {
          id: true,
          user: true,
          borrado: true,
          createdAt: true,
          updatedAt: true,
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
      return cuenta;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }

  update(id: number, updateCuentaDto: UpdateCuentaDto) {
    return `This action updates a #${id} cuenta ${JSON.stringify(updateCuentaDto)}`;
  }

  async remove(id: number) {
    try {
      const cuenta = await this.prismaService.cuenta.delete({
        where: { id },
        select: {
          id: true,
          user: true,
          borrado: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!cuenta) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Cuenta no encontrada',
        });
      }
      return cuenta;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }
}
