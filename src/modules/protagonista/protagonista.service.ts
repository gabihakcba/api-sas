import { Injectable } from '@nestjs/common';
import { CreateProtagonistaDto } from './dto/create-protagonista.dto';
import { UpdateProtagonistaDto } from './dto/update-protagonista.dto';
import { PrismaClient } from '@prisma/client';
import { Tx } from '../prisma/types/prisma';
import { CuentaService } from 'src/modules/cuenta/cuenta.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class ProtagonistaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cuentaService: CuentaService,
  ) { }

  async create(createProtagonistaDto: CreateProtagonistaDto) {
    try {
      const { miembro, id_rama, ...rest } = createProtagonistaDto;
      console.log(createProtagonistaDto);
      const protagonista = await this.prismaService.$transaction(
        async (tx: Tx) => {
          const nuevaCuenta = await this.cuentaService.create(tx, {
            user: miembro.dni,
            password: miembro.dni,
          });
          const protagonista = await tx.protagonista.create({
            data: {
              ...rest,
              Miembro: {
                create: {
                  ...miembro,
                  MiembroRama: { create: { id_rama } },
                  Cuenta: {
                    connect: {
                      id: nuevaCuenta.id,
                    },
                  },
                },
              },
            },
            include: {
              Miembro: {
                include: {
                  MiembroRama: {
                    include: {
                      Rama: true,
                    },
                  },
                },
              },
            },
          });
          const parsed = {
            ...protagonista.Miembro,
            rama: protagonista.Miembro.MiembroRama?.Rama.nombre,
          };
          return parsed;
        },
      );

      return protagonista;
    } catch (error) {
      console.log(error);
      throw new Error(`${error}`);
    }
  }

  async findAll(user: any, scopeIds?: number[], useOwnScope?: boolean) {
    const where: any = {};

    // Si no hay scopeIds ni useOwnScope, asumimos GLOBAL (o sin restricciones) -> Devuelve todo
    // (El PermissionsGuard ya valida si tiene permiso GLOBAL, en cuyo caso no setea scopeIds ni useOwnScope)
    if ((!scopeIds || scopeIds.length === 0) && !useOwnScope) {
      // No filters
    } else {
      const conditions: any[] = [];

      // Filtro por RAMA
      if (scopeIds && scopeIds.length > 0) {
        conditions.push({
          Miembro: {
            MiembroRama: {
              id_rama: { in: scopeIds },
            },
          },
        });
      }

      // Filtro por OWN
      if (useOwnScope) {
        const dependents = user.accountContext?.dependents || [];
        const protagonistIds = dependents.map((d: any) => d.protagonistaId);
        conditions.push({
          id: { in: protagonistIds },
        });
      }

      if (conditions.length > 0) {
        where.OR = conditions;
      } else {
        // Si tiene flags pero no generó condiciones (ej: OWN pero sin dependientes),
        // forzamos que no devuelva nada para seguridad.
        // OJO: Si scopeIds venía vacío y useOwnScope true pero sin dependientes -> No devuelve nada.
        where.id = -1; // Hack para no devolver nada
      }
    }

    const protagonistas = await this.prismaService.protagonista.findMany({
      where,
      include: {
        Miembro: {
          include: {
            MiembroRama: {
              include: {
                Rama: true,
              },
            },
          },
        },
      },
    });
    const parsed = protagonistas.map((protagonista) => {
      return {
        ...protagonista.Miembro,
        rama: protagonista.Miembro.MiembroRama?.Rama.nombre,
      };
    });
    return parsed;
  }

  findOne(id: number) {
    return `This action returns a #${id} protagonista`;
  }

  update(id: number, updateProtagonistaDto: UpdateProtagonistaDto) {
    return `This action updates a #${id} ${JSON.stringify(updateProtagonistaDto)} protagonista`;
  }

  remove(id: number) {
    return `This action removes a #${id} protagonista`;
  }
}
