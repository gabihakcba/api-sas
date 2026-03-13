import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCuentaDineroDto } from './dto/create-cuenta-dinero.dto';
import { UpdateCuentaDineroDto } from './dto/update-cuenta-dinero.dto';

@Injectable()
export class CuentasDineroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeFilterService: ScopeFilterService,
  ) {}

  async findAll(user: AuthenticatedUser, paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.scopeFilterService.mergeWhere(
      {
        borrado: false,
      },
      this.scopeFilterService.forCuentasDinero(user),
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cuentaDinero.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          nombre: 'asc',
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          monto_actual: true,
          id_area: true,
          id_rama: true,
          Area: {
            select: {
              id: true,
              nombre: true,
            },
          },
          Rama: {
            select: {
              id: true,
              nombre: true,
              id_area: true,
            },
          },
          _count: {
            select: {
              Pago: {
                where: {
                  borrado: false,
                },
              },
            },
          },
        },
      }),
      this.prisma.cuentaDinero.count({ where }),
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

  async getOptions(user: AuthenticatedUser) {
    const [areas, ramas] = await this.prisma.$transaction([
      this.prisma.area.findMany({
        where: this.scopeFilterService.mergeWhere(
          { borrado: false },
          this.scopeFilterService.forAreas(user),
        ),
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
        },
      }),
      this.prisma.rama.findMany({
        where: this.scopeFilterService.mergeWhere(
          { borrado: false },
          this.scopeFilterService.forRamas(user),
        ),
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          id_area: true,
        },
      }),
    ]);

    return {
      areas,
      ramas,
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const cuenta = await this.prisma.cuentaDinero.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          id,
          borrado: false,
        },
        this.scopeFilterService.forCuentasDinero(user),
      ),
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        monto_actual: true,
        id_area: true,
        id_rama: true,
        Area: {
          select: {
            id: true,
            nombre: true,
          },
        },
        Rama: {
          select: {
            id: true,
            nombre: true,
            id_area: true,
          },
        },
        _count: {
          select: {
            Pago: {
              where: {
                borrado: false,
              },
            },
          },
        },
      },
    });

    if (!cuenta) {
      throw new NotFoundException('La cuenta de dinero indicada no existe.');
    }

    return cuenta;
  }

  async create(dto: CreateCuentaDineroDto, user: AuthenticatedUser) {
    const assignment = await this.resolveAssignment(dto);
    await this.validateScopedAccess(user, assignment);
    await this.ensureUniqueName(dto.nombre, null);

    return this.prisma.cuentaDinero.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        monto_actual: new Prisma.Decimal(dto.montoActual),
        id_area: assignment.idArea ?? null,
        id_rama: assignment.idRama ?? null,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        monto_actual: true,
        id_area: true,
        id_rama: true,
        Area: {
          select: {
            id: true,
            nombre: true,
          },
        },
        Rama: {
          select: {
            id: true,
            nombre: true,
            id_area: true,
          },
        },
        _count: {
          select: {
            Pago: {
              where: {
                borrado: false,
              },
            },
          },
        },
      },
    });
  }

  async update(
    id: number,
    dto: UpdateCuentaDineroDto,
    user: AuthenticatedUser,
  ) {
    const existing = await this.findOne(id, user);

    const assignment = await this.resolveAssignment({
      idArea: dto.idArea ?? existing.id_area ?? undefined,
      idRama: dto.idRama ?? existing.id_rama ?? undefined,
    });

    await this.validateScopedAccess(user, assignment);
    await this.ensureUniqueName(dto.nombre ?? existing.nombre, id);

    return this.prisma.cuentaDinero.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion.trim() || null }
          : {}),
        ...(dto.montoActual !== undefined
          ? { monto_actual: new Prisma.Decimal(dto.montoActual) }
          : {}),
        id_area: assignment.idArea ?? null,
        id_rama: assignment.idRama ?? null,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        monto_actual: true,
        id_area: true,
        id_rama: true,
        Area: {
          select: {
            id: true,
            nombre: true,
          },
        },
        Rama: {
          select: {
            id: true,
            nombre: true,
            id_area: true,
          },
        },
        _count: {
          select: {
            Pago: {
              where: {
                borrado: false,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number, user: AuthenticatedUser) {
    await this.findOne(id, user);

    await this.prisma.cuentaDinero.update({
      where: { id },
      data: {
        borrado: true,
      },
    });
  }

  private async ensureUniqueName(name: string, currentId: number | null) {
    const existing = await this.prisma.cuentaDinero.findFirst({
      where: {
        nombre: name.trim(),
        borrado: false,
        ...(currentId ? { NOT: { id: currentId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una cuenta de dinero activa con ese nombre.',
      );
    }
  }

  private async resolveAssignment(input: {
    idArea?: number;
    idRama?: number;
  }): Promise<{ idArea?: number; idRama?: number }> {
    if (input.idArea && input.idRama) {
      throw new BadRequestException(
        'La cuenta de dinero debe pertenecer a un area o a una rama, no a ambas.',
      );
    }

    if (!input.idArea && !input.idRama) {
      throw new BadRequestException(
        'Debes indicar un area o una rama para la cuenta de dinero.',
      );
    }

    if (input.idArea) {
      const area = await this.prisma.area.findFirst({
        where: {
          id: input.idArea,
          borrado: false,
        },
        select: { id: true },
      });

      if (!area) {
        throw new NotFoundException('El area indicada no existe.');
      }

      return { idArea: area.id };
    }

    const rama = await this.prisma.rama.findFirst({
      where: {
        id: input.idRama,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!rama) {
      throw new NotFoundException('La rama indicada no existe.');
    }

    return { idRama: rama.id };
  }

  private async validateScopedAccess(
    user: AuthenticatedUser,
    assignment: { idArea?: number; idRama?: number },
  ) {
    const scopedWhere = this.scopeFilterService.forCuentasDinero(user);

    if (Object.keys(scopedWhere).length === 0) {
      return;
    }

    const allowed = await this.prisma.cuentaDinero.findFirst({
      where: this.scopeFilterService.mergeWhere(
        {
          borrado: false,
          ...(assignment.idArea ? { id_area: assignment.idArea } : {}),
          ...(assignment.idRama ? { id_rama: assignment.idRama } : {}),
        },
        scopedWhere,
      ),
      select: { id: true },
    });

    if (!allowed) {
      if (assignment.idArea) {
        const areaMatch = await this.prisma.area.findFirst({
          where: this.scopeFilterService.mergeWhere(
            { id: assignment.idArea, borrado: false },
            this.scopeFilterService.forAreas(user),
          ),
          select: { id: true },
        });

        if (areaMatch) {
          return;
        }
      }

      if (assignment.idRama) {
        const ramaMatch = await this.prisma.rama.findFirst({
          where: this.scopeFilterService.mergeWhere(
            { id: assignment.idRama, borrado: false },
            this.scopeFilterService.forRamas(user),
          ),
          select: { id: true },
        });

        if (ramaMatch) {
          return;
        }
      }

      throw new ForbiddenException(
        'El usuario no posee un scope valido para esta cuenta de dinero.',
      );
    }
  }
}
