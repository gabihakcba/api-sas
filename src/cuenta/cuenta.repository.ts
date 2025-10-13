import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PrismaClientOrTransaction = PrismaClient | Prisma.TransactionClient;

const cuentaSummarySelect = {
  id: true,
  user: true,
  borrado: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CuentaSelect;

const cuentaWithRolesSelect = {
  ...cuentaSummarySelect,
  CuentaRole: {
    include: {
      Role: true,
    },
  },
} satisfies Prisma.CuentaSelect;

const cuentaForAuthSelect = {
  ...cuentaWithRolesSelect,
  password: true,
  Miembro: {
    select: {
      nombre: true,
      apellidos: true,
      dni: true,
    },
  },
} satisfies Prisma.CuentaSelect;

const cuentaForAuthWithoutPasswordSelect = {
  ...cuentaForAuthSelect,
  password: false,
} satisfies Prisma.CuentaSelect;

const cuentaContextSelect = {
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
} satisfies Prisma.CuentaSelect;

const responsabilidadDependentsSelect = {
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
} satisfies Prisma.ResponsabilidadSelect;

export type CuentaSummary = Prisma.CuentaGetPayload<{
  select: typeof cuentaSummarySelect;
}>;

export type CuentaWithRoles = Prisma.CuentaGetPayload<{
  select: typeof cuentaWithRolesSelect;
}>;

export type CuentaForAuth = Prisma.CuentaGetPayload<{
  select: typeof cuentaForAuthSelect;
}>;

export type CuentaForAuthWithoutPassword = Prisma.CuentaGetPayload<{
  select: typeof cuentaForAuthWithoutPasswordSelect;
}>;

type CuentaContextResult = Prisma.CuentaGetPayload<{
  select: typeof cuentaContextSelect;
}>;

type DependenciaResult = Prisma.ResponsabilidadGetPayload<{
  select: typeof responsabilidadDependentsSelect;
}>;

@Injectable()
export class CuentaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(client?: PrismaClientOrTransaction) {
    return client ?? this.prisma;
  }

  async create(
    data: Prisma.CuentaCreateInput,
    client?: PrismaClientOrTransaction,
  ): Promise<CuentaSummary> {
    return this.getClient(client).cuenta.create({
      data,
      select: cuentaSummarySelect,
    });
  }

  async findAll(client?: PrismaClientOrTransaction): Promise<CuentaSummary[]> {
    return this.getClient(client).cuenta.findMany({
      select: cuentaSummarySelect,
    });
  }

  async findById(
    id: number,
    client?: PrismaClientOrTransaction,
  ): Promise<CuentaWithRoles | null> {
    return this.getClient(client).cuenta.findUnique({
      where: { id },
      select: cuentaWithRolesSelect,
    });
  }

  async findByUser(
    user: string,
    { withPassword = false }: { withPassword?: boolean } = {},
    client?: PrismaClientOrTransaction,
  ): Promise<CuentaForAuth | CuentaForAuthWithoutPassword | null> {
    const select = withPassword
      ? cuentaForAuthSelect
      : cuentaForAuthWithoutPasswordSelect;

    return this.getClient(client).cuenta.findUnique({
      where: { user },
      select,
    });
  }

  async update(
    id: number,
    data: Prisma.CuentaUpdateInput,
    client?: PrismaClientOrTransaction,
  ): Promise<CuentaSummary> {
    return this.getClient(client).cuenta.update({
      where: { id },
      data,
      select: cuentaSummarySelect,
    });
  }

  async delete(
    id: number,
    client?: PrismaClientOrTransaction,
  ): Promise<CuentaSummary> {
    return this.getClient(client).cuenta.delete({
      where: { id },
      select: cuentaSummarySelect,
    });
  }

  async findAccountContext(
    id: number,
    client?: PrismaClientOrTransaction,
  ): Promise<CuentaContextResult | null> {
    return this.getClient(client).cuenta.findUnique({
      where: { id },
      select: cuentaContextSelect,
    });
  }

  async findDependentsByResponsable(
    responsableId: number,
    client?: PrismaClientOrTransaction,
  ): Promise<DependenciaResult[]> {
    return this.getClient(client).responsabilidad.findMany({
      where: { id_responsable: responsableId },
      select: responsabilidadDependentsSelect,
    });
  }
}
