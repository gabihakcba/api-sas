import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    // usar super para que TS/ESLint reconozca el método tipado
    await super.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await super.$disconnect();
  }

  /**
   * Ejecuta un bloque de código dentro de una transacción de Prisma.
   *
   * Este helper se expone para centralizar el uso de transacciones y, de esta
   * forma, mantener la misma interfaz tanto en los servicios como en los
   * repositorios.
   */
  async runInTransaction<T>(
    handler: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => handler(tx));
  }
}
