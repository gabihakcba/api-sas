import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarioService {
  constructor(private readonly prisma: PrismaService) {}

  async getCumpleanios(fromValue: string, toValue: string) {
    const from = new Date(fromValue);
    const to = new Date(toValue);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException(
        'Debes indicar un rango de fechas válido para el calendario.',
      );
    }

    if (to < from) {
      throw new BadRequestException(
        'La fecha final del calendario no puede ser anterior a la inicial.',
      );
    }

    const miembros = await this.prisma.miembro.findMany({
      where: {
        borrado: false,
      },
      orderBy: [{ apellidos: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        dni: true,
        fecha_nacimiento: true,
        Protagonista: {
          where: {
            borrado: false,
            activo: true,
          },
          select: {
            id: true,
          },
        },
        MiembroRama: {
          where: {
            borrado: false,
            fecha_egreso: null,
          },
          orderBy: {
            fecha_ingreso: 'desc',
          },
          take: 1,
          select: {
            Rama: {
              select: {
                nombre: true,
              },
            },
          },
        },
        Adulto: {
          where: {
            borrado: false,
            activo: true,
          },
          select: {
            id: true,
            EquipoArea: {
              where: {
                borrado: false,
                activo: true,
                fecha_fin: null,
              },
              orderBy: {
                fecha_inicio: 'desc',
              },
              take: 1,
              select: {
                Area: {
                  select: {
                    nombre: true,
                  },
                },
                Rama: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const birthdays = miembros.flatMap((miembro) => {
      const results: Array<{
        id: string;
        miembroId: number;
        nombreCompleto: string;
        dni: string;
        fecha: Date;
        tipoMiembro: 'protagonista' | 'adulto' | 'otro';
        ramaNombre: string | null;
        areaNombre: string | null;
      }> = [];
      const birthDate = miembro.fecha_nacimiento;
      const month = birthDate.getUTCMonth();
      const day = birthDate.getUTCDate();
      const currentRama =
        miembro.MiembroRama[0]?.Rama.nombre ??
        miembro.Adulto?.EquipoArea[0]?.Rama?.nombre ??
        null;
      const currentArea = miembro.Adulto?.EquipoArea[0]?.Area.nombre ?? null;
      const memberType = miembro.Protagonista
        ? 'protagonista'
        : miembro.Adulto
          ? 'adulto'
          : 'otro';

      for (
        let year = from.getUTCFullYear();
        year <= to.getUTCFullYear();
        year += 1
      ) {
        const occurrenceDate = this.buildBirthdayOccurrence(year, month, day);

        if (occurrenceDate < from || occurrenceDate > to) {
          continue;
        }

        results.push({
          id: `${miembro.id}-${year}`,
          miembroId: miembro.id,
          nombreCompleto: `${miembro.apellidos}, ${miembro.nombre}`,
          dni: miembro.dni,
          fecha: occurrenceDate,
          tipoMiembro: memberType,
          ramaNombre: currentRama,
          areaNombre: currentArea,
        });
      }

      return results;
    });

    return birthdays;
  }

  private buildBirthdayOccurrence(year: number, month: number, day: number) {
    if (month === 1 && day === 29 && !this.isLeapYear(year)) {
      return new Date(Date.UTC(year, 1, 28, 12, 0, 0, 0));
    }

    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  }

  private isLeapYear(year: number) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}
