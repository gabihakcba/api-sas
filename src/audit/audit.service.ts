import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActionPayload } from './audit.types';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async createLogEntry(input: {
    cuenta: unknown;
    miembro: unknown;
    endpoint: string;
    ip: string | null;
    userAgent: string | null;
  }) {
    return this.prisma.log.create({
      data: {
        cuenta: this.sanitizePayload(input.cuenta),
        miembro: this.sanitizePayload(input.miembro),
        endpoint: input.endpoint,
        ip: input.ip,
        userAgent: input.userAgent,
      },
      select: {
        id: true,
      },
    });
  }

  async recordAction(payload: AuditActionPayload) {
    if (!payload.logId) {
      return;
    }

    await this.prisma.action.create({
      data: {
        id_log: payload.logId,
        tabla: payload.tabla,
        pre_registro: this.sanitizePayload(payload.preRegistro),
        post_registro: this.sanitizePayload(payload.postRegistro),
      },
    });
  }

  sanitizePayload(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify(value ?? null, (_key, currentValue: unknown) => {
        if (Buffer.isBuffer(currentValue)) {
          return '[binary]';
        }

        if (typeof currentValue === 'string' && currentValue.length > 2000) {
          return `${currentValue.slice(0, 2000)}...[truncated]`;
        }

        return currentValue;
      }),
    ) as Prisma.InputJsonValue;
  }
}
