// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AREAS } from 'src/common/constants/db/areas';
import { POSICIONES } from 'src/common/constants/db/posiciones';
import { RAMAS } from 'src/common/constants/db/ramas';
import { ROLES } from 'src/common/constants/db/roles';

const prisma = new PrismaClient();

async function main() {
  // 1) Roles
  const roles = await prisma.$transaction([
    prisma.role.upsert({
      where: { nombre: ROLES.JEFATURA },
      update: {},
      create: { nombre: ROLES.JEFATURA, descripcion: 'Jefatura: acceso total' },
    }),
    prisma.role.upsert({
      where: { nombre: ROLES.JEFATURA_RAMA },
      update: {},
      create: { nombre: ROLES.JEFATURA, descripcion: '-' },
    }),
    prisma.role.upsert({
      where: { nombre: ROLES.TESORERIA },
      update: {},
      create: { nombre: ROLES.TESORERIA, descripcion: '-' },
    }),
    prisma.role.upsert({
      where: { nombre: ROLES.TESORERIA_RAMA },
      update: {},
      create: { nombre: ROLES.TESORERIA_RAMA, descripcion: '-' },
    }),
    prisma.role.upsert({
      where: { nombre: ROLES.AYUDANTE_RAMA },
      update: {},
      create: { nombre: ROLES.AYUDANTE_RAMA, descripcion: '-' },
    }),
    prisma.role.upsert({
      where: { nombre: ROLES.RESPONSABLE },
      update: {},
      create: { nombre: ROLES.RESPONSABLE, descripcion: '-' },
    }),
    prisma.role.upsert({
      where: { nombre: ROLES.PROTAGONISTA },
      update: {},
      create: { nombre: ROLES.PROTAGONISTA, descripcion: '-' },
    }),
  ]);

  // 2) Usuario admin (solo si no existe)
  const adminUser = await prisma.cuenta.findUnique({
    where: { user: '40684496' },
  });

  if (!adminUser) {
    const password = await bcrypt.hash('40684496', 10);
    const created = await prisma.cuenta.create({
      data: {
        user: 'admin',
        password,
        CuentaRole: { connect: roles.map((r) => ({ id: r.id })) },
      },
    });
    console.log('Admin creado:', created.user);
  } else {
    console.log('Admin ya existe, omitiendo…');
  }

  // 3) Ramas
  const ramas = await prisma.$transaction([
    prisma.rama.upsert({
      where: { nombre: RAMAS.CASTORES },
      update: {},
      create: {
        borrado: true,
        nombre: RAMAS.CASTORES,
        edad_minima_protagonistas: 3,
        edad_maxima_protagonistas: 5,
        edad_minima_adulto: 22,
      },
    }),
    prisma.rama.upsert({
      where: { nombre: RAMAS.MANADA },
      update: {},
      create: {
        nombre: RAMAS.MANADA,
        edad_minima_protagonistas: 6,
        edad_maxima_protagonistas: 10,
        edad_minima_adulto: 22,
      },
    }),
    prisma.rama.upsert({
      where: { nombre: RAMAS.UNIDAD },
      update: {},
      create: {
        nombre: RAMAS.UNIDAD,
        edad_minima_protagonistas: 11,
        edad_maxima_protagonistas: 13,
        edad_minima_adulto: 22,
      },
    }),
    prisma.rama.upsert({
      where: { nombre: RAMAS.CAMINANTES },
      update: {},
      create: {
        nombre: RAMAS.CAMINANTES,
        edad_minima_protagonistas: 14,
        edad_maxima_protagonistas: 17,
        edad_minima_adulto: 25,
      },
    }),
    prisma.rama.upsert({
      where: { nombre: RAMAS.ROVER },
      update: {},
      create: {
        nombre: RAMAS.ROVER,
        edad_minima_protagonistas: 18,
        edad_maxima_protagonistas: 22,
        edad_minima_adulto: 30,
      },
    }),
  ]);

  // Areas
  const areas = await prisma.$transaction([
    prisma.area.upsert({
      where: { nombre: AREAS.JEFATURA },
      update: {},
      create: { nombre: AREAS.JEFATURA, descripcion: '' },
    }),
    prisma.area.upsert({
      where: { nombre: AREAS.TESORERIA },
      update: {},
      create: { nombre: AREAS.TESORERIA, descripcion: '' },
    }),
    prisma.area.upsert({
      where: { nombre: AREAS.SECRETARIA },
      update: {},
      create: { nombre: AREAS.SECRETARIA, descripcion: '' },
    }),
    prisma.area.upsert({
      where: { nombre: AREAS.INTENDENCIA },
      update: {},
      create: { nombre: AREAS.INTENDENCIA, descripcion: '' },
    }),
    prisma.area.upsert({
      where: { nombre: AREAS.RAMA },
      update: {},
      create: { nombre: AREAS.RAMA, descripcion: '' },
    }),
  ]);

  // 6) Posiciones
  const posiciones = await prisma.$transaction([
    prisma.posicionArea.upsert({
      where: { nombre: POSICIONES.JEFE },
      update: {},
      create: { nombre: POSICIONES.JEFE, descripcion: '' },
    }),
    prisma.posicionArea.upsert({
      where: { nombre: POSICIONES.SUBJEFE },
      update: {},
      create: { nombre: POSICIONES.SUBJEFE, descripcion: '' },
    }),
    prisma.posicionArea.upsert({
      where: { nombre: POSICIONES.SECRETARIO },
      update: {},
      create: { nombre: POSICIONES.SECRETARIO, descripcion: '' },
    }),
    prisma.posicionArea.upsert({
      where: { nombre: POSICIONES.TESORERO },
      update: {},
      create: { nombre: POSICIONES.TESORERO, descripcion: '' },
    }),
    prisma.posicionArea.upsert({
      where: { nombre: POSICIONES.AYUDANTE },
      update: {},
      create: { nombre: POSICIONES.AYUDANTE, descripcion: '' },
    }),
  ]);

  // 4) Jefes de ramas
  const adultos = await prisma.$transaction([
    prisma.cuenta.upsert({
      where: { user: 'margayp' },
      update: {},
      create: { user: 'margayp', password: 'margayp' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'koala' },
      update: {},
      create: { user: 'koala', password: 'koala' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'lobot' },
      update: {},
      create: { user: 'lobot', password: 'lobot' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'lobo' },
      update: {},
      create: { user: 'lobo', password: 'lobo' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'jirafa' },
      update: {},
      create: { user: 'jirafa', password: 'jirafa' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'zuricata' },
      update: {},
      create: { user: 'zuricata', password: 'zuricata' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'libelula' },
      update: {},
      create: { user: 'libelula', password: 'libelula' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'pandarojo' },
      update: {},
      create: { user: 'pandarojo', password: 'pandarojo' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'loris' },
      update: {},
      create: { user: 'loris', password: 'loris' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'ornitorrinco' },
      update: {},
      create: { user: 'ornitorrinco', password: 'ornitorrinco' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'quoka' },
      update: {},
      create: { user: 'quoka', password: 'quoka' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'colibri' },
      update: {},
      create: { user: 'colibri', password: 'colibri' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'lechuza' },
      update: {},
      create: { user: 'lechuza', password: 'lechuza' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'margay' },
      update: {},
      create: { user: 'marygay', password: 'margay' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'zorro' },
      update: {},
      create: { user: 'zorro', password: 'zorro' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'panteranegra' },
      update: {},
      create: { user: 'panteranegra', password: 'panteranegra' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'yagurundi' },
      update: {},
      create: { user: 'yagurundi', password: 'yagurundi' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'muercielago' },
      update: {},
      create: { user: 'muercielago', password: 'muercielago' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'erizo' },
      update: {},
      create: { user: 'erizo', password: 'erizo' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'gabi' },
      update: {},
      create: { user: 'gabi', password: 'gabi' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'milu' },
      update: {},
      create: { user: 'milu', password: 'milu' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'juli' },
      update: {},
      create: { user: 'juli', password: 'juli' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'leona' },
      update: {},
      create: { user: 'leona', password: 'leona' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'ornitorrincof' },
      update: {},
      create: { user: 'ornitorrincof', password: 'ornitorrincof' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'oso' },
      update: {},
      create: { user: 'oso', password: 'oso' },
    }),
    prisma.cuenta.upsert({
      where: { user: 'mari' },
      update: {},
      create: { user: 'mari', password: 'mari' },
    }),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
