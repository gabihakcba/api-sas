import { Prisma, PrismaClient, SCOPE } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const TEST_PASSWORD = 'test1234';
const TEST_START_DATE = new Date('2026-01-01');
const CURRENT_YEAR = 2026;

const RAMA_PROTAGONIST_COUNT = 5;

const RAMA_STAFF_CONFIG = [
  {
    roleName: 'JEFATURA_RAMA',
    positionName: 'Jefe',
    nameSuffix: 'jefe',
  },
  {
    roleName: 'AYUDANTE_RAMA',
    positionName: 'Ayudante',
    nameSuffix: 'ayudante',
  },
] as const;

const AREA_STAFF_CONFIG = [
  {
    areaName: 'Jefatura',
    positionName: 'Jefe',
    roleName: 'JEFATURA',
    scopeType: SCOPE.GLOBAL,
  },
  {
    areaName: 'Secretaria y Tesoreria',
    positionName: 'Secretario',
    roleName: 'SECRETARIA_TESORERIA',
    scopeType: SCOPE.AREA,
  },
  {
    areaName: 'Intendencia',
    positionName: 'Jefe',
    roleName: 'INTENDENCIA',
    scopeType: SCOPE.AREA,
  },
] as const;

type LookupEntity = {
  id: number;
  nombre: string;
};

type RamaLookupEntity = LookupEntity & {
  edad_minima_protagonistas: number;
  edad_maxima_protagonistas: number;
  edad_minima_adulto: number;
};

type SeedLookups = {
  areas: Map<string, LookupEntity>;
  ramas: Map<string, RamaLookupEntity>;
  positions: Map<string, LookupEntity>;
  roles: Map<string, LookupEntity>;
};

type BaseMemberInput = {
  user: string;
  dni: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: Date;
  direccion: string;
  email: string;
  telefono?: string;
  telefonoEmergencia: string;
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function buildBirthDate(age: number, month: number, day: number): Date {
  return new Date(Date.UTC(CURRENT_YEAR - age, month - 1, day));
}

function getAgeWithinRange(min: number, max: number, index: number): number {
  const span = max - min + 1;
  return min + (index % span);
}

async function loadLookups(tx: Prisma.TransactionClient): Promise<SeedLookups> {
  const areaNames = [
    ...AREA_STAFF_CONFIG.map((staff) => staff.areaName),
    'Rama',
  ];
  const roleNames = Array.from(
    new Set<string>([
      'PROTAGONISTA',
      ...RAMA_STAFF_CONFIG.map((staff) => staff.roleName),
      ...AREA_STAFF_CONFIG.flatMap((staff) =>
        staff.roleName ? [staff.roleName] : [],
      ),
    ]),
  );
  const positionNames = Array.from(
    new Set<string>([
      ...RAMA_STAFF_CONFIG.map((staff) => staff.positionName),
      ...AREA_STAFF_CONFIG.map((staff) => staff.positionName),
    ]),
  );

  const [areas, ramas, positions, roles] = await Promise.all([
    tx.area.findMany({
      where: {
        nombre: {
          in: areaNames,
        },
      },
      select: {
        id: true,
        nombre: true,
      },
    }),
    tx.rama.findMany({
      select: {
        id: true,
        nombre: true,
        edad_minima_protagonistas: true,
        edad_maxima_protagonistas: true,
        edad_minima_adulto: true,
      },
      orderBy: {
        id: 'asc',
      },
    }),
    tx.posicionArea.findMany({
      where: {
        nombre: {
          in: positionNames,
        },
      },
      select: {
        id: true,
        nombre: true,
      },
    }),
    tx.role.findMany({
      where: {
        nombre: {
          in: roleNames,
        },
      },
      select: {
        id: true,
        nombre: true,
      },
    }),
  ]);

  const areaMap = new Map<string, LookupEntity>(
    areas.map((area) => [area.nombre, area]),
  );
  const ramaMap = new Map<string, RamaLookupEntity>(
    ramas.map((rama) => [rama.nombre, rama]),
  );
  const positionMap = new Map<string, LookupEntity>(
    positions.map((position) => [position.nombre, position]),
  );
  const roleMap = new Map<string, LookupEntity>(
    roles.map((role) => [role.nombre, role]),
  );

  if (ramaMap.size === 0) {
    throw new Error('No hay ramas cargadas. Ejecuta primero el seed base.');
  }

  for (const areaName of areaNames) {
    if (!areaMap.has(areaName)) {
      throw new Error(
        `Falta el area ${areaName}. Ejecuta primero el seed base.`,
      );
    }
  }

  for (const positionName of positionNames) {
    if (!positionMap.has(positionName)) {
      throw new Error(
        `Falta la posicion ${positionName}. Ejecuta primero el seed base.`,
      );
    }
  }

  for (const roleName of roleNames) {
    if (!roleMap.has(roleName)) {
      throw new Error(
        `Falta el rol ${roleName}. Ejecuta primero el seed base.`,
      );
    }
  }

  return {
    areas: areaMap,
    ramas: ramaMap,
    positions: positionMap,
    roles: roleMap,
  };
}

async function ensureCuentaYMiembro(
  tx: Prisma.TransactionClient,
  passwordHash: string,
  input: BaseMemberInput,
): Promise<{
  cuentaId: number;
  miembroId: number;
}> {
  let cuenta = await tx.cuenta.findUnique({
    where: { user: input.user },
  });

  if (!cuenta) {
    cuenta = await tx.cuenta.create({
      data: {
        user: input.user,
        password: passwordHash,
      },
    });
  }

  let miembro = await tx.miembro.findUnique({
    where: { dni: input.dni },
  });

  if (!miembro) {
    miembro = await tx.miembro.create({
      data: {
        nombre: input.nombre,
        apellidos: input.apellidos,
        dni: input.dni,
        fecha_nacimiento: input.fechaNacimiento,
        direccion: input.direccion,
        email: input.email,
        telefono: input.telefono,
        telefono_emergencia: input.telefonoEmergencia,
        id_cuenta: cuenta.id,
      },
    });
  } else {
    if (miembro.id_cuenta !== cuenta.id) {
      throw new Error(
        `El DNI ${input.dni} ya existe vinculado a otra cuenta. Ajusta los datos antes de reintentar el seed-test.`,
      );
    }

    miembro = await tx.miembro.update({
      where: { id: miembro.id },
      data: {
        nombre: input.nombre,
        apellidos: input.apellidos,
        fecha_nacimiento: input.fechaNacimiento,
        direccion: input.direccion,
        email: input.email,
        telefono: input.telefono,
        telefono_emergencia: input.telefonoEmergencia,
      },
    });
  }

  return {
    cuentaId: cuenta.id,
    miembroId: miembro.id,
  };
}

async function ensureProtagonistaEnRama(
  tx: Prisma.TransactionClient,
  miembroId: number,
  ramaId: number,
): Promise<void> {
  await tx.protagonista.upsert({
    where: { id_miembro: miembroId },
    update: {
      activo: true,
      es_becado: false,
    },
    create: {
      id_miembro: miembroId,
    },
  });

  const ramaActiva = await tx.miembroRama.findFirst({
    where: {
      id_miembro: miembroId,
      id_rama: ramaId,
      borrado: false,
      fecha_egreso: null,
    },
  });

  if (!ramaActiva) {
    await tx.miembroRama.create({
      data: {
        id_miembro: miembroId,
        id_rama: ramaId,
        fecha_ingreso: TEST_START_DATE,
      },
    });
  }
}

async function ensureAdulto(
  tx: Prisma.TransactionClient,
  miembroId: number,
): Promise<number> {
  const adulto = await tx.adulto.upsert({
    where: { id_miembro: miembroId },
    update: {
      activo: true,
      es_becado: false,
    },
    create: {
      id_miembro: miembroId,
    },
  });

  return adulto.id;
}

async function ensureCuentaRole(
  tx: Prisma.TransactionClient,
  cuentaId: number,
  roleId: number,
  scopeType: SCOPE,
  scopeId: number | null,
): Promise<void> {
  const existingRole = await tx.cuentaRole.findFirst({
    where: {
      id_cuenta: cuentaId,
      id_role: roleId,
      tipo_scope: scopeType,
      id_scope: scopeId,
    },
  });

  if (!existingRole) {
    await tx.cuentaRole.create({
      data: {
        id_cuenta: cuentaId,
        id_role: roleId,
        tipo_scope: scopeType,
        id_scope: scopeId,
      },
    });
  }
}

async function ensureEquipoArea(
  tx: Prisma.TransactionClient,
  adultoId: number,
  areaId: number,
  posicionId: number,
  ramaId: number | null,
): Promise<void> {
  const existingAssignment = await tx.equipoArea.findFirst({
    where: {
      id_adulto: adultoId,
      id_area: areaId,
      id_posicion: posicionId,
      id_rama: ramaId,
      borrado: false,
      activo: true,
      fecha_fin: null,
    },
  });

  if (!existingAssignment) {
    await tx.equipoArea.create({
      data: {
        id_adulto: adultoId,
        id_area: areaId,
        id_posicion: posicionId,
        id_rama: ramaId,
        fecha_inicio: TEST_START_DATE,
      },
    });
  }
}

async function ensureCuentaDineroMiembro(
  tx: Prisma.TransactionClient,
  miembroId: number,
  nombre: string,
  descripcion: string,
): Promise<void> {
  const existing = await tx.cuentaDinero.findFirst({
    where: {
      id_miembro: miembroId,
      nombre,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await tx.cuentaDinero.update({
      where: { id: existing.id },
      data: {
        descripcion,
        id_miembro: miembroId,
        id_area: null,
        id_rama: null,
        borrado: false,
      },
    });
    return;
  }

  await tx.cuentaDinero.create({
    data: {
      nombre,
      descripcion,
      id_miembro: miembroId,
    },
  });
}

async function seedProtagonistasPorRama(
  tx: Prisma.TransactionClient,
  lookups: SeedLookups,
  passwordHash: string,
): Promise<void> {
  console.log('Creando protagonistas de prueba...');

  let dniSequence = 10000000;
  const protagonistaRole = lookups.roles.get('PROTAGONISTA');

  if (!protagonistaRole) {
    throw new Error(
      'Falta el rol PROTAGONISTA. Ejecuta primero el seed base.',
    );
  }

  for (const rama of lookups.ramas.values()) {
    const ramaSlug = slugify(rama.nombre);

    for (let index = 0; index < RAMA_PROTAGONIST_COUNT; index += 1) {
      const sequence = index + 1;
      const age = getAgeWithinRange(
        rama.edad_minima_protagonistas,
        rama.edad_maxima_protagonistas,
        index,
      );

      const { cuentaId, miembroId } = await ensureCuentaYMiembro(
        tx,
        passwordHash,
        {
        user: `test.protagonista.${ramaSlug}.${sequence}`,
        dni: `${dniSequence}`,
        nombre: `Protagonista${sequence}`,
        apellidos: rama.nombre,
        fechaNacimiento: buildBirthDate(age, sequence, 10 + sequence),
        direccion: `Calle ${rama.nombre} ${sequence}`,
        email: `test.protagonista.${ramaSlug}.${sequence}@sas.local`,
        telefonoEmergencia: `54011000${dniSequence}`,
        },
      );

      await ensureProtagonistaEnRama(tx, miembroId, rama.id);
      await ensureCuentaRole(
        tx,
        cuentaId,
        protagonistaRole.id,
        SCOPE.RAMA,
        rama.id,
      );
      await ensureCuentaDineroMiembro(
        tx,
        miembroId,
        `Caja protagonista ${rama.nombre} ${sequence}`,
        `Cuenta personal del protagonista ${sequence} de la rama ${rama.nombre}.`,
      );
      dniSequence += 1;
    }
  }
}

async function seedAdultosPorRama(
  tx: Prisma.TransactionClient,
  lookups: SeedLookups,
  passwordHash: string,
): Promise<void> {
  console.log('Creando adultos de rama de prueba...');

  const areaRama = lookups.areas.get('Rama');

  if (!areaRama) {
    throw new Error(
      'No se encontro el area Rama. Ejecuta primero el seed base.',
    );
  }

  let dniSequence = 20000000;

  for (const rama of lookups.ramas.values()) {
    const ramaSlug = slugify(rama.nombre);

    for (const staff of RAMA_STAFF_CONFIG) {
      const position = lookups.positions.get(staff.positionName);
      const role = lookups.roles.get(staff.roleName);

      if (!position || !role) {
        throw new Error(
          `Falta la posicion o rol para ${staff.roleName}. Ejecuta primero el seed base.`,
        );
      }

      const { cuentaId, miembroId } = await ensureCuentaYMiembro(
        tx,
        passwordHash,
        {
          user: `test.adulto.${staff.nameSuffix}.${ramaSlug}`,
          dni: `${dniSequence}`,
          nombre: staff.positionName,
          apellidos: rama.nombre,
          fechaNacimiento: buildBirthDate(rama.edad_minima_adulto + 5, 6, 10),
          direccion: `Base ${rama.nombre}`,
          email: `test.adulto.${staff.nameSuffix}.${ramaSlug}@sas.local`,
          telefono: `54022000${dniSequence}`,
          telefonoEmergencia: `54023000${dniSequence}`,
        },
      );

      const adultoId = await ensureAdulto(tx, miembroId);

      await ensureEquipoArea(tx, adultoId, areaRama.id, position.id, rama.id);
      await ensureCuentaRole(tx, cuentaId, role.id, SCOPE.RAMA, rama.id);
      await ensureCuentaDineroMiembro(
        tx,
        miembroId,
        `Caja adulto ${staff.positionName} ${rama.nombre}`,
        `Cuenta personal del adulto ${staff.positionName} asignado a ${rama.nombre}.`,
      );

      dniSequence += 1;
    }
  }
}

async function seedAdultosDeArea(
  tx: Prisma.TransactionClient,
  lookups: SeedLookups,
  passwordHash: string,
): Promise<void> {
  console.log('Creando adultos de areas generales de prueba...');

  let dniSequence = 30000000;

  for (const staff of AREA_STAFF_CONFIG) {
    const area = lookups.areas.get(staff.areaName);
    const position = lookups.positions.get(staff.positionName);

    if (!area || !position) {
      throw new Error(
        `Falta el area o la posicion para ${staff.areaName}. Ejecuta primero el seed base.`,
      );
    }

    const areaSlug = slugify(staff.areaName);

    const { cuentaId, miembroId } = await ensureCuentaYMiembro(
      tx,
      passwordHash,
      {
        user: `test.area.${areaSlug}`,
        dni: `${dniSequence}`,
        nombre: staff.positionName,
        apellidos: staff.areaName,
        fechaNacimiento: buildBirthDate(35, 7, 15),
        direccion: `Sede ${staff.areaName}`,
        email: `test.area.${areaSlug}@sas.local`,
        telefono: `54024000${dniSequence}`,
        telefonoEmergencia: `54025000${dniSequence}`,
      },
    );

    const adultoId = await ensureAdulto(tx, miembroId);

    await ensureEquipoArea(tx, adultoId, area.id, position.id, null);

    if (staff.roleName && staff.scopeType) {
      const role = lookups.roles.get(staff.roleName);

      if (!role) {
        throw new Error(
          `Falta el rol ${staff.roleName}. Ejecuta primero el seed base.`,
        );
      }

      const scopeId = staff.scopeType === SCOPE.AREA ? area.id : null;
      await ensureCuentaRole(tx, cuentaId, role.id, staff.scopeType, scopeId);
    }

    await ensureCuentaDineroMiembro(
      tx,
      miembroId,
      `Caja adulto ${staff.areaName}`,
      `Cuenta personal del adulto asignado al area ${staff.areaName}.`,
    );

    dniSequence += 1;
  }
}

async function main() {
  console.log('Iniciando seed-test...');

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  await prisma.$transaction(async (tx) => {
    const lookups = await loadLookups(tx);

    await seedProtagonistasPorRama(tx, lookups, passwordHash);
    await seedAdultosPorRama(tx, lookups, passwordHash);
    await seedAdultosDeArea(tx, lookups, passwordHash);
  });

  console.log('Seed-test completado con exito.');
}

main()
  .catch((error) => {
    console.error('Error en el seed-test:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
