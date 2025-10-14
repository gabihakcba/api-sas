import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorManager } from 'src/utils/error.manager';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { MiembroWithCuenta } from './types/miembro-with-cuenta.type';

@Injectable()
export class MiembroService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createMiembroDto: CreateMiembroDto): Promise<MiembroWithCuenta> {
    try {
      const {
        cuenta,
        nombre,
        apellidos,
        dni,
        fecha_nacimiento,
        direccion,
        email,
        telefono,
        telefono_emergencia,
        totem,
        cualidad,
      } = createMiembroDto;

      const hashedPassword = await bcrypt.hash(
        cuenta.password,
        Number(process.env.HASH_SALT),
      );

      const miembro = await this.prismaService.miembro.create({
        data: {
          nombre,
          apellidos,
          dni,
          fecha_nacimiento: new Date(fecha_nacimiento),
          direccion,
          email,
          telefono,
          telefono_emergencia,
          totem,
          cualidad,
          Cuenta: {
            create: {
              user: cuenta.user,
              password: hashedPassword,
            },
          },
        },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dni: true,
          fecha_nacimiento: true,
          direccion: true,
          email: true,
          telefono: true,
          telefono_emergencia: true,
          totem: true,
          cualidad: true,
          borrado: true,
          createdAt: true,
          updatedAt: true,
          Cuenta: {
            select: {
              id: true,
              user: true,
              borrado: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return miembro;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw ErrorManager.createSignatureError(message);
    }
  }
}
