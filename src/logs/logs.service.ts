import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LogsQueryDto } from './dto/logs-query.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LogsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.q?.trim();
    const where: Prisma.LogWhereInput = {
      ...(query.endpoint
        ? {
            endpoint: query.endpoint,
          }
        : {}),
      ...(query.username
        ? {
            cuenta: {
              path: ['username'],
              equals: query.username,
            },
          }
        : {}),
      ...(query.tabla
        ? {
            Action: {
              some: {
                tabla: query.tabla,
              },
            },
          }
        : {}),
      ...(searchTerm
        ? {
            OR: [
              {
                endpoint: {
                  contains: searchTerm,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                ip: {
                  contains: searchTerm,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                userAgent: {
                  contains: searchTerm,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.log.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          endpoint: true,
          timestamp: true,
          ip: true,
          userAgent: true,
          createdAt: true,
          cuenta: true,
          miembro: true,
          Action: {
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
              id: true,
              tabla: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.log.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOptions() {
    const [endpoints, accounts, actions] = await this.prisma.$transaction([
      this.prisma.log.findMany({
        distinct: ['endpoint'],
        orderBy: { endpoint: 'asc' },
        select: {
          endpoint: true,
        },
      }),
      this.prisma.log.findMany({
        orderBy: { id: 'desc' },
        select: {
          cuenta: true,
        },
      }),
      this.prisma.action.findMany({
        distinct: ['tabla'],
        orderBy: { tabla: 'asc' },
        select: {
          tabla: true,
        },
      }),
    ]);

    const usernames = Array.from(
      new Set(
        accounts
          .map((item) => this.extractUsername(item.cuenta))
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return {
      endpoints: endpoints.map((item) => item.endpoint),
      usernames,
      tablas: actions.map((item) => item.tabla),
    };
  }

  private extractUsername(value: Prisma.JsonValue): string | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const username = value['username'];
    return typeof username === 'string' && username.trim().length > 0
      ? username
      : null;
  }
}
