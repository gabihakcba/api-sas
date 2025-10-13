import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthAccountContext } from 'src/auth/interfaces/auth-account-context.interface';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import {
  CuentaForAuth,
  CuentaForAuthWithoutPassword,
  CuentaRepository,
  CuentaSummary,
  CuentaWithRoles,
} from './cuenta.repository';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorManager } from '../utils/error.manager';

@Injectable()
export class CuentaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cuentaRepository: CuentaRepository,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, Number(process.env.HASH_SALT));
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): string {
    switch (error.code) {
      case 'P2002':
        return new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El usuario ya existe',
        }).message;
      case 'P2025':
        return new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Cuenta no encontrada',
        }).message;
      default:
        return new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'Error en la base de datos',
        }).message;
    }
  }

  async create(createCuentaDto: CreateCuentaDto): Promise<CuentaSummary> {
    try {
      const { user, password } = createCuentaDto;
      const hashedPassword = await this.hashPassword(password);

      return this.prismaService.runInTransaction((tx) =>
        this.cuentaRepository.create({ user, password: hashedPassword }, tx),
      );
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        ErrorManager.createSignatureError(this.mapPrismaError(error));
      }
      if (error instanceof ErrorManager) {
        ErrorManager.createSignatureError(error.message);
      }
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      ErrorManager.createSignatureError(message);
    }
  }

  async findAll(): Promise<CuentaSummary[]> {
    try {
      return this.cuentaRepository.findAll();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        ErrorManager.createSignatureError(this.mapPrismaError(error));
      }
      if (error instanceof ErrorManager) {
        ErrorManager.createSignatureError(error.message);
      }
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      ErrorManager.createSignatureError(message);
    }
  }

  async findById(id: number | string): Promise<CuentaWithRoles> {
    const Id = id as number;
    try {
      const cuenta = await this.cuentaRepository.findById(Id);
      if (!cuenta) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'Cuenta no encontrada',
        });
      }
      return cuenta;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        ErrorManager.createSignatureError(this.mapPrismaError(error));
      }
      if (error instanceof ErrorManager) {
        ErrorManager.createSignatureError(error.message);
      }
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      ErrorManager.createSignatureError(message);
    }
  }

  async buildAuthAccountContext(
    id: number,
  ): Promise<AuthAccountContext | null> {
    return this.prismaService.runInTransaction(async (tx) => {
      const cuenta = await this.cuentaRepository.findAccountContext(id, tx);

      if (!cuenta) {
        return null;
      }

      const dependents: AuthAccountContext['dependents'] = [];
      const responsableId = cuenta.Miembro?.Responsable?.id;

      if (typeof responsableId === 'number') {
        const responsabilidades =
          await this.cuentaRepository.findDependentsByResponsable(
            responsableId,
            tx,
          );

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
    });
  }

  async findByUser(
    user: string,
    withPassword: true,
  ): Promise<CuentaForAuth | null>;
  async findByUser(
    user: string,
    withPassword: false,
  ): Promise<CuentaForAuthWithoutPassword | null>;
  async findByUser(
    user: string,
    withPassword: boolean,
  ): Promise<CuentaForAuth | CuentaForAuthWithoutPassword | null> {
    try {
      return this.cuentaRepository.findByUser(user, { withPassword });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        ErrorManager.createSignatureError(this.mapPrismaError(error));
      }
      if (error instanceof ErrorManager) {
        ErrorManager.createSignatureError(error.message);
      }
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      ErrorManager.createSignatureError(message);
    }
  }

  async update(
    id: number,
    updateCuentaDto: UpdateCuentaDto,
  ): Promise<CuentaSummary> {
    try {
      return this.prismaService.runInTransaction(async (tx) => {
        const data: Prisma.CuentaUpdateInput = {};

        if (typeof updateCuentaDto.user === 'string') {
          data.user = updateCuentaDto.user;
        }

        if (typeof updateCuentaDto.password === 'string') {
          data.password = await this.hashPassword(updateCuentaDto.password);
        }

        return this.cuentaRepository.update(id, data, tx);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        ErrorManager.createSignatureError(this.mapPrismaError(error));
      }
      if (error instanceof ErrorManager) {
        ErrorManager.createSignatureError(error.message);
      }
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      ErrorManager.createSignatureError(message);
    }
  }

  async remove(id: number): Promise<CuentaSummary> {
    try {
      return this.cuentaRepository.delete(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        ErrorManager.createSignatureError(this.mapPrismaError(error));
      }
      if (error instanceof ErrorManager) {
        ErrorManager.createSignatureError(error.message);
      }
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      ErrorManager.createSignatureError(message);
    }
  }
}
