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
    scopeType: SCOPE.GRUPO,
  },
  {
    areaName: 'Jefatura',
    positionName: 'Ayudante',
    roleName: 'AYUDANTE',
    scopeType: SCOPE.GRUPO,
  },
  {
    areaName: 'Secretaria y Tesoreria',
    positionName: 'Secretario',
    roleName: 'SECRETARIA_TESORERIA',
    scopeType: SCOPE.GRUPO,
  },
  {
    areaName: 'Intendencia',
    positionName: 'Jefe',
    roleName: 'INTENDENCIA',
    scopeType: SCOPE.GRUPO,
  },
] as const;

type LookupEntity = {
  id: number;
  nombre: string;
};

type RelationLookupEntity = {
  id: number;
  tipo: string;
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
  relaciones: Map<string, RelationLookupEntity>;
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
      'RESPONSABLE',
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

  const areas = await tx.area.findMany({
    where: {
      nombre: {
        in: areaNames,
      },
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  const ramas = await tx.rama.findMany({
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
  });

  const positions = await tx.posicionArea.findMany({
    where: {
      nombre: {
        in: positionNames,
      },
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  const roles = await tx.role.findMany({
    where: {
      nombre: {
        in: roleNames,
      },
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  const relaciones = await tx.relacion.findMany({
    where: {
      tipo: {
        in: ['Madre', 'Padre'],
      },
    },
    select: {
      id: true,
      tipo: true,
    },
  });

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
  const relationMap = new Map<string, RelationLookupEntity>(
    relaciones.map((relacion) => [relacion.tipo, relacion]),
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

  for (const relationType of ['Madre', 'Padre']) {
    if (!relationMap.has(relationType)) {
      throw new Error(
        `Falta la relacion ${relationType}. Ejecuta primero el seed base.`,
      );
    }
  }

  return {
    areas: areaMap,
    ramas: ramaMap,
    positions: positionMap,
    roles: roleMap,
    relaciones: relationMap,
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
  const cuentaByUser = await tx.cuenta.findUnique({
    where: { user: input.user },
  });

  let miembro = await tx.miembro.findUnique({
    where: { dni: input.dni },
  });

  let cuenta = cuentaByUser;

  if (miembro) {
    const cuentaVinculada = await tx.cuenta.findUnique({
      where: { id: miembro.id_cuenta },
    });

    if (!cuentaVinculada) {
      throw new Error(
        `El miembro con DNI ${input.dni} no tiene una cuenta valida asociada.`,
      );
    }

    if (cuentaByUser && cuentaByUser.id !== cuentaVinculada.id) {
      throw new Error(
        `El user ${input.user} ya existe vinculado a otra cuenta distinta al DNI ${input.dni}. Ajusta los datos antes de reintentar el seed-test.`,
      );
    }

    cuenta = await tx.cuenta.update({
      where: { id: cuentaVinculada.id },
      data: {
        user: input.user,
        password: passwordHash,
        borrado: false,
      },
    });
  }

  if (!cuenta) {
    cuenta = await tx.cuenta.create({
      data: {
        user: input.user,
        password: passwordHash,
      },
    });
  }

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
        id_cuenta: cuenta.id,
        borrado: false,
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

async function ensureResponsable(
  tx: Prisma.TransactionClient,
  miembroId: number,
): Promise<number> {
  const responsable = await tx.responsable.upsert({
    where: { id_miembro: miembroId },
    update: {
      borrado: false,
    },
    create: {
      id_miembro: miembroId,
    },
  });

  return responsable.id;
}

async function ensureCuentaDineroResponsable(
  tx: Prisma.TransactionClient,
  miembroId: number,
  nombre: string,
  apellidos: string,
): Promise<void> {
  const existing = await tx.cuentaDinero.findFirst({
    where: {
      id_miembro: miembroId,
    },
    select: {
      id: true,
    },
  });

  const data = {
    nombre: `Caja ${nombre} ${apellidos}`.trim(),
    descripcion:
      `Cuenta personal del responsable ${nombre} ${apellidos}`.trim(),
    id_miembro: miembroId,
    id_area: null,
    id_rama: null,
    borrado: false,
  };

  if (existing) {
    await tx.cuentaDinero.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  await tx.cuentaDinero.create({
    data,
  });
}

async function ensureResponsabilidad(
  tx: Prisma.TransactionClient,
  responsableId: number,
  protagonistaId: number,
  relacionId: number,
): Promise<void> {
  const existing = await tx.responsabilidad.findFirst({
    where: {
      id_responsable: responsableId,
      id_protagonista: protagonistaId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await tx.responsabilidad.update({
      where: { id: existing.id },
      data: {
        id_relacion: relacionId,
        borrado: false,
      },
    });
    return;
  }

  await tx.responsabilidad.create({
    data: {
      id_responsable: responsableId,
      id_protagonista: protagonistaId,
      id_relacion: relacionId,
    },
  });
}

async function ensurePago(
  tx: Prisma.TransactionClient,
  input: {
    miembroId: number;
    cuentaDestinoId: number;
    cuentaOrigenId: number;
    metodoPagoId: number;
    conceptoPagoId: number;
    monto: Prisma.Decimal;
    fechaPago: Date;
    detalles: string;
  },
): Promise<void> {
  const existing = await tx.pago.findFirst({
    where: {
      borrado: false,
      id_miembro: input.miembroId,
      id_cuenta_dinero: input.cuentaDestinoId,
      id_cuenta_origen: input.cuentaOrigenId,
      id_metodo_pago: input.metodoPagoId,
      id_concepto_pago: input.conceptoPagoId,
      monto: input.monto,
      fecha_pago: input.fechaPago,
      detalles: input.detalles,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return;
  }

  await tx.pago.create({
    data: {
      id_miembro: input.miembroId,
      id_cuenta_dinero: input.cuentaDestinoId,
      id_cuenta_origen: input.cuentaOrigenId,
      id_metodo_pago: input.metodoPagoId,
      id_concepto_pago: input.conceptoPagoId,
      monto: input.monto,
      fecha_pago: input.fechaPago,
      createdAt: input.fechaPago,
      detalles: input.detalles,
    },
  });
}

async function ensureEvento(
  tx: Prisma.TransactionClient,
  input: {
    nombre: string;
    descripcion: string;
    fechaInicio: Date;
    fechaFin: Date;
    lugar: string;
    terminado: boolean;
    costoMp?: Prisma.Decimal;
    costoMa?: Prisma.Decimal;
    costoAyudante?: Prisma.Decimal;
    tipoId: number;
    areaIds: number[];
    ramaIds: number[];
    miembroIds: number[];
  },
): Promise<void> {
  const existing = await tx.evento.findFirst({
    where: {
      nombre: input.nombre,
      borrado: false,
    },
    select: {
      id: true,
    },
  });

  const data = {
    nombre: input.nombre,
    descripcion: input.descripcion,
    fecha_inicio: input.fechaInicio,
    fecha_fin: input.fechaFin,
    lugar: input.lugar,
    terminado: input.terminado,
    costo_mp: input.costoMp ?? new Prisma.Decimal(0),
    costo_ma: input.costoMa ?? new Prisma.Decimal(0),
    costo_ayudante: input.costoAyudante ?? new Prisma.Decimal(0),
    id_tipo: input.tipoId,
    borrado: false,
  };

  const eventoId = existing
    ? (
        await tx.evento.update({
          where: { id: existing.id },
          data,
          select: { id: true },
        })
      ).id
    : (
        await tx.evento.create({
          data,
          select: { id: true },
        })
      ).id;

  await tx.areaAfectada.deleteMany({
    where: {
      id_evento: eventoId,
    },
  });

  if (input.areaIds.length > 0) {
    await tx.areaAfectada.createMany({
      data: input.areaIds.map((areaId) => ({
        id_evento: eventoId,
        id_area: areaId,
      })),
    });
  }

  await tx.ramaAfectada.updateMany({
    where: {
      id_evento: eventoId,
    },
    data: {
      borrado: true,
    },
  });

  if (input.ramaIds.length > 0) {
    await tx.ramaAfectada.createMany({
      data: input.ramaIds.map((ramaId) => ({
        id_evento: eventoId,
        id_rama: ramaId,
      })),
    });
  }

  await tx.inscripcionEvento.updateMany({
    where: {
      id_evento: eventoId,
    },
    data: {
      borrado: true,
    },
  });

  if (input.miembroIds.length > 0) {
    await tx.inscripcionEvento.createMany({
      data: input.miembroIds.map((miembroId) => ({
        id_evento: eventoId,
        id_miembro: miembroId,
        descripcion: `Inscripcion de prueba para ${input.nombre}`,
        monto_total: new Prisma.Decimal(0),
        saldo_pendiente: new Prisma.Decimal(0),
      })),
    });
  }
}

async function ensureComision(
  tx: Prisma.TransactionClient,
  input: {
    nombre: string;
    descripcion: string;
    eventoId: number;
  },
): Promise<void> {
  const existing = await tx.comision.findFirst({
    where: {
      nombre: input.nombre,
      id_evento: input.eventoId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await tx.comision.update({
      where: { id: existing.id },
      data: {
        descripcion: input.descripcion,
        borrado: false,
      },
    });
    return;
  }

  await tx.comision.create({
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion,
      id_evento: input.eventoId,
    },
  });
}

async function ensureAsignacionApf(
  tx: Prisma.TransactionClient,
  adultoId: number,
  consejoId: number,
  observacion: string,
): Promise<void> {
  const existing = await tx.asignacionAPF.findFirst({
    where: {
      id_adulto: adultoId,
      borrado: false,
      fecha_fin: null,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return;
  }

  await tx.asignacionAPF.create({
    data: {
      id_adulto: adultoId,
      id_consejo: consejoId,
      observacion,
    },
  });
}

async function ensureTemarioConsejo(
  tx: Prisma.TransactionClient,
  input: {
    consejoId: number;
    titulo: string;
    descripcion: string;
    sinMp: boolean;
  },
): Promise<void> {
  const existing = await tx.temarioConsejo.findFirst({
    where: {
      id_consejo: input.consejoId,
      titulo: input.titulo,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await tx.temarioConsejo.update({
      where: { id: existing.id },
      data: {
        descripcion: input.descripcion,
        sin_mp: input.sinMp,
        borrado: false,
      },
    });
    return;
  }

  await tx.temarioConsejo.create({
    data: {
      id_consejo: input.consejoId,
      titulo: input.titulo,
      descripcion: input.descripcion,
      sin_mp: input.sinMp,
    },
  });
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
    throw new Error('Falta el rol PROTAGONISTA. Ejecuta primero el seed base.');
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
    const positionSlug = slugify(staff.positionName);

    const { cuentaId, miembroId } = await ensureCuentaYMiembro(
      tx,
      passwordHash,
      {
        user: `test.area.${areaSlug}.${positionSlug}`,
        dni: `${dniSequence}`,
        nombre: staff.positionName,
        apellidos: staff.areaName,
        fechaNacimiento: buildBirthDate(35, 7, 15),
        direccion: `Sede ${staff.areaName}`,
        email: `test.area.${areaSlug}.${positionSlug}@sas.local`,
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

      await ensureCuentaRole(tx, cuentaId, role.id, staff.scopeType, null);
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

async function seedResponsablesPorRama(
  tx: Prisma.TransactionClient,
  lookups: SeedLookups,
  passwordHash: string,
): Promise<void> {
  console.log('Creando responsables de prueba...');

  const responsableRole = lookups.roles.get('RESPONSABLE');
  const madreRelacion = lookups.relaciones.get('Madre');
  const padreRelacion = lookups.relaciones.get('Padre');

  if (!responsableRole || !madreRelacion || !padreRelacion) {
    throw new Error(
      'Faltan datos base para responsables. Ejecuta primero el seed base.',
    );
  }

  let dniSequence = 40000000;

  for (const rama of lookups.ramas.values()) {
    const ramaSlug = slugify(rama.nombre);

    const protagonistas = await tx.protagonista.findMany({
      where: {
        borrado: false,
        activo: true,
        Miembro: {
          borrado: false,
          MiembroRama: {
            some: {
              id_rama: rama.id,
              borrado: false,
              fecha_egreso: null,
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        Miembro: {
          select: {
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    for (let index = 0; index < protagonistas.length; index += 1) {
      const protagonista = protagonistas[index];
      const sequence = index + 1;

      const { cuentaId, miembroId } = await ensureCuentaYMiembro(
        tx,
        passwordHash,
        {
          user: `test.responsable.madre.${ramaSlug}.${sequence}`,
          dni: `${dniSequence}`,
          nombre: 'Madre',
          apellidos: `${protagonista.Miembro.apellidos} ${sequence}`,
          fechaNacimiento: buildBirthDate(38, 5, 10 + sequence),
          direccion: `Casa familia ${rama.nombre} ${sequence}`,
          email: `test.responsable.madre.${ramaSlug}.${sequence}@sas.local`,
          telefono: `54026000${dniSequence}`,
          telefonoEmergencia: `54027000${dniSequence}`,
        },
      );

      const responsableId = await ensureResponsable(tx, miembroId);
      await ensureCuentaDineroResponsable(
        tx,
        miembroId,
        'Madre',
        `${protagonista.Miembro.apellidos} ${sequence}`,
      );
      await ensureCuentaRole(
        tx,
        cuentaId,
        responsableRole.id,
        SCOPE.RAMA,
        rama.id,
      );
      await ensureResponsabilidad(
        tx,
        responsableId,
        protagonista.id,
        madreRelacion.id,
      );

      dniSequence += 1;
    }

    const protagonistaExtra = protagonistas[0];

    if (!protagonistaExtra) {
      continue;
    }

    const { cuentaId, miembroId } = await ensureCuentaYMiembro(
      tx,
      passwordHash,
      {
        user: `test.responsable.padre.${ramaSlug}.extra`,
        dni: `${dniSequence}`,
        nombre: 'Padre',
        apellidos: `${protagonistaExtra.Miembro.apellidos} Extra`,
        fechaNacimiento: buildBirthDate(40, 8, 20),
        direccion: `Casa familia ${rama.nombre} extra`,
        email: `test.responsable.padre.${ramaSlug}.extra@sas.local`,
        telefono: `54028000${dniSequence}`,
        telefonoEmergencia: `54029000${dniSequence}`,
      },
    );

    const responsableId = await ensureResponsable(tx, miembroId);
    await ensureCuentaDineroResponsable(
      tx,
      miembroId,
      'Padre',
      `${protagonistaExtra.Miembro.apellidos} Extra`,
    );
    await ensureCuentaRole(
      tx,
      cuentaId,
      responsableRole.id,
      SCOPE.RAMA,
      rama.id,
    );
    await ensureResponsabilidad(
      tx,
      responsableId,
      protagonistaExtra.id,
      padreRelacion.id,
    );

    dniSequence += 1;
  }
}

async function seedPagosProtagonistasPorRama(
  tx: Prisma.TransactionClient,
): Promise<void> {
  console.log('Creando pagos de prueba para protagonistas...');

  const fechaPago = new Date('2026-02-25T00:00:00.000Z');
  const cuentaGrupo = await tx.cuentaDinero.findFirst({
    where: {
      nombre: 'Caja General Grupo',
      borrado: false,
    },
    select: {
      id: true,
    },
  });

  const metodoTransferencia = await tx.metodoPago.findFirst({
    where: {
      nombre: 'Transferencia',
      borrado: false,
    },
    select: {
      id: true,
    },
  });

  const conceptoAfiliacion = await tx.conceptoPago.findFirst({
    where: {
      nombre: 'Afiliacion',
      borrado: false,
    },
    select: {
      id: true,
    },
  });

  const conceptoCuota = await tx.conceptoPago.findFirst({
    where: {
      nombre: 'Cuota',
      borrado: false,
    },
    select: {
      id: true,
    },
  });

  if (!cuentaGrupo || !metodoTransferencia || !conceptoAfiliacion || !conceptoCuota) {
    throw new Error(
      'Faltan cuentas o catálogos base para sembrar pagos. Ejecuta primero el seed base.',
    );
  }

  const protagonistas = await tx.protagonista.findMany({
    where: {
      borrado: false,
      activo: true,
      Miembro: {
        borrado: false,
      },
    },
    orderBy: {
      id: 'asc',
    },
    select: {
      id: true,
      Miembro: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          CuentaDinero: {
            where: {
              borrado: false,
            },
            orderBy: {
              id: 'asc',
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  for (const protagonista of protagonistas) {
    const cuentaOrigen = protagonista.Miembro.CuentaDinero[0];

    if (!cuentaOrigen) {
      throw new Error(
        `El protagonista ${protagonista.id} no tiene cuenta de dinero personal para sembrar pagos.`,
      );
    }

    await ensurePago(tx, {
      miembroId: protagonista.Miembro.id,
      cuentaDestinoId: cuentaGrupo.id,
      cuentaOrigenId: cuentaOrigen.id,
      metodoPagoId: metodoTransferencia.id,
      conceptoPagoId: conceptoAfiliacion.id,
      monto: new Prisma.Decimal(46000),
      fechaPago,
      detalles: `Pago de afiliacion de ${protagonista.Miembro.nombre} ${protagonista.Miembro.apellidos}`,
    });

    await ensurePago(tx, {
      miembroId: protagonista.Miembro.id,
      cuentaDestinoId: cuentaGrupo.id,
      cuentaOrigenId: cuentaOrigen.id,
      metodoPagoId: metodoTransferencia.id,
      conceptoPagoId: conceptoCuota.id,
      monto: new Prisma.Decimal(10000),
      fechaPago,
      detalles: `Pago de cuota de ${protagonista.Miembro.nombre} ${protagonista.Miembro.apellidos}`,
    });
  }
}

async function seedEventosDePrueba(
  tx: Prisma.TransactionClient,
  lookups: SeedLookups,
): Promise<void> {
  console.log('Creando eventos de prueba...');

  const campamentoTipo = await tx.tipoEvento.findFirst({
    where: {
      nombre: 'Campamento',
      borrado: false,
    },
    select: {
      id: true,
    },
  });

  const descubiertaTipo = await tx.tipoEvento.findFirst({
    where: {
      nombre: 'Descubierta',
      borrado: false,
    },
    select: {
      id: true,
    },
  });

  if (!campamentoTipo || !descubiertaTipo) {
    throw new Error(
      'Faltan tipos de evento base para sembrar eventos de prueba. Ejecuta primero el seed base.',
    );
  }

  const allAreaIds = Array.from(lookups.areas.values()).map((area) => area.id);
  const allRamas = Array.from(lookups.ramas.values());
  const allRamaIds = allRamas.map((rama) => rama.id);

  const adultos = await tx.adulto.findMany({
    where: {
      borrado: false,
      activo: true,
      Miembro: {
        borrado: false,
      },
    },
    select: {
      Miembro: {
        select: {
          id: true,
        },
      },
    },
  });

  const protagonistas = await tx.protagonista.findMany({
    where: {
      borrado: false,
      activo: true,
      Miembro: {
        borrado: false,
      },
    },
    orderBy: {
      id: 'asc',
    },
    select: {
      Miembro: {
        select: {
          id: true,
          MiembroRama: {
            where: {
              borrado: false,
              fecha_egreso: null,
            },
            take: 1,
            select: {
              id_rama: true,
            },
          },
        },
      },
    },
  });

  const protagonistasPorRama = new Map<number, number[]>();

  for (const protagonista of protagonistas) {
    const ramaId = protagonista.Miembro.MiembroRama[0]?.id_rama;

    if (!ramaId) {
      continue;
    }

    const rows = protagonistasPorRama.get(ramaId) ?? [];
    rows.push(protagonista.Miembro.id);
    protagonistasPorRama.set(ramaId, rows);
  }

  await ensureEvento(tx, {
    nombre: 'Campamento de verano',
    descripcion: 'Campamento general de verano con participación de todas las ramas y áreas.',
    fechaInicio: new Date('2026-01-12T08:00:00.000Z'),
    fechaFin: new Date('2026-01-18T18:00:00.000Z'),
    lugar: 'Predio Scout de Verano',
    terminado: false,
    tipoId: campamentoTipo.id,
    areaIds: allAreaIds,
    ramaIds: allRamaIds,
    miembroIds: adultos.map((adulto) => adulto.Miembro.id),
  });

  await ensureEvento(tx, {
    nombre: 'Campamento de invierno',
    descripcion: 'Campamento general de invierno con participación parcial de protagonistas por rama.',
    fechaInicio: new Date('2026-07-17T08:00:00.000Z'),
    fechaFin: new Date('2026-07-19T18:00:00.000Z'),
    lugar: 'Predio Scout de Invierno',
    terminado: false,
    tipoId: campamentoTipo.id,
    areaIds: allAreaIds,
    ramaIds: allRamaIds,
    miembroIds: allRamas.flatMap((rama) =>
      (protagonistasPorRama.get(rama.id) ?? []).slice(0, 2),
    ),
  });

  const areaRama = lookups.areas.get('Rama');
  if (!areaRama) {
    throw new Error(
      'Falta el área Rama para sembrar descubiertas. Ejecuta primero el seed base.',
    );
  }

  for (const rama of allRamas) {
    await ensureEvento(tx, {
      nombre: `Descubierta ${rama.nombre}`,
      descripcion: `Descubierta de prueba para la rama ${rama.nombre}.`,
      fechaInicio: new Date('2026-09-12T09:00:00.000Z'),
      fechaFin: new Date('2026-09-12T19:00:00.000Z'),
      lugar: `Punto de salida ${rama.nombre}`,
      terminado: false,
      tipoId: descubiertaTipo.id,
      areaIds: [areaRama.id],
      ramaIds: [rama.id],
      miembroIds: (protagonistasPorRama.get(rama.id) ?? []).slice(0, 3),
    });
  }
}

async function seedComisionesDePrueba(
  tx: Prisma.TransactionClient,
): Promise<void> {
  console.log('Creando comisiones de prueba...');

  const summerEvent = await tx.evento.findFirst({
    where: {
      nombre: 'Campamento de verano',
      borrado: false,
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  const winterEvent = await tx.evento.findFirst({
    where: {
      nombre: 'Campamento de invierno',
      borrado: false,
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  if (!summerEvent || !winterEvent) {
    throw new Error(
      'Faltan los campamentos base para sembrar comisiones de prueba.',
    );
  }

  const baseCommissions = [
    'Cocina',
    'Intendencia',
    'Programa',
    'Gran Juego',
    'Fogon',
  ] as const;

  for (const event of [summerEvent, winterEvent]) {
    for (const commissionName of baseCommissions) {
      await ensureComision(tx, {
        nombre: `${commissionName} ${event.nombre}`,
        descripcion: `Comision de ${commissionName.toLowerCase()} para ${event.nombre.toLowerCase()}.`,
        eventoId: event.id,
      });
    }
  }
}

async function seedApfsIniciales(
  tx: Prisma.TransactionClient,
  lookups: SeedLookups,
): Promise<void> {
  console.log('Habilitando APFs iniciales de prueba...');

  let consejo = await tx.consejo.findFirst({
    where: {
      borrado: false,
    },
    orderBy: {
      fecha: 'desc',
    },
    select: {
      id: true,
    },
  });

  if (!consejo) {
    consejo = await tx.consejo.create({
      data: {
        nombre: 'Consejo de prueba para APFs',
        descripcion:
          'Consejo creado automaticamente por seed-test para habilitar APFs iniciales.',
        fecha: new Date('2026-03-01T19:00:00.000Z'),
        es_ordinario: true,
      },
      select: {
        id: true,
      },
    });
  }

  const jefaturaRole = lookups.roles.get('JEFATURA');
  const jefaturaRamaRole = lookups.roles.get('JEFATURA_RAMA');

  if (!jefaturaRole || !jefaturaRamaRole) {
    throw new Error(
      'Faltan roles base para sembrar APFs. Ejecuta primero el seed base.',
    );
  }

  const adults = await tx.adulto.findMany({
    where: {
      borrado: false,
      activo: true,
      Miembro: {
        borrado: false,
        Cuenta: {
          CuentaRole: {
            some: {
              id_role: {
                in: [jefaturaRole.id, jefaturaRamaRole.id],
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      Miembro: {
        select: {
          nombre: true,
          apellidos: true,
        },
      },
    },
  });

  for (const adult of adults) {
    await ensureAsignacionApf(
      tx,
      adult.id,
      consejo.id,
      `APF inicial de prueba para ${adult.Miembro.nombre} ${adult.Miembro.apellidos}`.trim(),
    );
  }

  const temasConsejo = [
    {
      titulo: 'Apertura del consejo',
      descripcion: 'Repaso inicial y organizacion general del consejo.',
      sinMp: false,
    },
    {
      titulo: 'Programacion de actividades',
      descripcion: 'Definicion de proximas actividades y responsables.',
      sinMp: false,
    },
    {
      titulo: 'Evaluacion del campamento',
      descripcion: 'Balance general del ultimo campamento realizado.',
      sinMp: false,
    },
    {
      titulo: 'Situacion particular de protagonistas',
      descripcion: 'Tema reservado para el equipo adulto.',
      sinMp: true,
    },
    {
      titulo: 'Seguimiento de responsables',
      descripcion: 'Tema reservado sobre acompanamiento familiar.',
      sinMp: true,
    },
  ] as const;

  for (const tema of temasConsejo) {
    await ensureTemarioConsejo(tx, {
      consejoId: consejo.id,
      titulo: tema.titulo,
      descripcion: tema.descripcion,
      sinMp: tema.sinMp,
    });
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
    await seedResponsablesPorRama(tx, lookups, passwordHash);
    await seedPagosProtagonistasPorRama(tx);
    await seedEventosDePrueba(tx, lookups);
    await seedComisionesDePrueba(tx);
    await seedApfsIniciales(tx, lookups);
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
