import { Injectable } from '@nestjs/common';
import { CreateProtagonistaDto } from './dto/create-protagonista.dto';
import { UpdateProtagonistaDto } from './dto/update-protagonista.dto';
import { PrismaClient } from '@prisma/client';
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
        async (tx: PrismaClient) => {
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

  async findAll(scopeId?: number) {
    const where: any = {};

    // Si nos llega un scopeId, filtramos por rama
    if (scopeId) {
      where.Miembro = {
        MiembroRama: {
          id_rama: scopeId
        }
      };
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
