import { ACTION, PrismaClient, RESOURCE } from '@prisma/client';
import { AREAS } from '../src/common/constants/db/areas';
import { RAMAS } from '../src/common/constants/db/ramas';

const prisma = new PrismaClient();

type ResourcePermission = { resource: RESOURCE; action: ACTION };

const areaSeeds: Array<{ nombre: string; descripcion?: string }> = [
  { nombre: AREAS.JEFATURA, descripcion: 'Jefatura' },
  { nombre: AREAS.TESORERIA, descripcion: 'Tesorería' },
  { nombre: AREAS.SECRETARIA, descripcion: 'Secretaría' },
  { nombre: AREAS.INTENDENCIA, descripcion: 'Intendencia' },
  { nombre: AREAS.RAMA, descripcion: 'Rama' },
];

const ramaSeeds: Array<{
  nombre: string;
  edad_minima_protagonistas: number;
  edad_maxima_protagonistas: number;
  edad_minima_adulto: number;
}> = [
  {
    nombre: RAMAS.CASTORES,
    edad_minima_protagonistas: 3,
    edad_maxima_protagonistas: 5,
    edad_minima_adulto: 22,
  },
  {
    nombre: RAMAS.MANADA,
    edad_minima_protagonistas: 6,
    edad_maxima_protagonistas: 10,
    edad_minima_adulto: 22,
  },
  {
    nombre: RAMAS.UNIDAD,
    edad_minima_protagonistas: 11,
    edad_maxima_protagonistas: 13,
    edad_minima_adulto: 22,
  },
  {
    nombre: RAMAS.CAMINANTES,
    edad_minima_protagonistas: 14,
    edad_maxima_protagonistas: 17,
    edad_minima_adulto: 25,
  },
  {
    nombre: RAMAS.ROVER,
    edad_minima_protagonistas: 18,
    edad_maxima_protagonistas: 22,
    edad_minima_adulto: 30,
  },
];

const readOnlyResources: RESOURCE[] = [RESOURCE.LOG, RESOURCE.ACTION];

const roleDefinitions: Array<{
  nombre: string;
  descripcion: string;
  permissions: ResourcePermission[];
}> = [];

const allResources = Object.values(RESOURCE);

const addRole = (
  nombre: string,
  descripcion: string,
  permissions: ResourcePermission[],
) => roleDefinitions.push({ nombre, descripcion, permissions });

addRole(
  'SUPER_ADMIN',
  'Acceso total a todos los recursos',
  allResources.map((resource) => ({ resource, action: ACTION.MANAGE })),
);

addRole(
  'JEFE_GRUPO',
  'Gestión operativa y lectura de estructura',
  [
    RESOURCE.MIEMBRO,
    RESOURCE.PROTAGONISTA,
    RESOURCE.ADULTO,
    RESOURCE.RESPONSABLE,
    RESOURCE.EVENTO,
    RESOURCE.INSCRIPCION,
    RESOURCE.PAGO,
    RESOURCE.ASISTENCIA,
  ]
    .map(
      (resource): ResourcePermission => ({ resource, action: ACTION.MANAGE }),
    )
    .concat([
      { resource: RESOURCE.AREA, action: ACTION.READ },
      { resource: RESOURCE.RAMA, action: ACTION.READ },
    ]),
);

addRole('JEFE_RAMA', 'Gestión de protagonistas y eventos de su rama', [
  { resource: RESOURCE.PROTAGONISTA, action: ACTION.MANAGE },
  { resource: RESOURCE.ASISTENCIA, action: ACTION.MANAGE },
  { resource: RESOURCE.EVENTO, action: ACTION.MANAGE },
  { resource: RESOURCE.PLAN_FORMACION, action: ACTION.MANAGE },
]);

addRole('SECRETARIA', 'Gestión de miembros y libros de actas', [
  { resource: RESOURCE.MIEMBRO, action: ACTION.MANAGE },
  { resource: RESOURCE.ADULTO, action: ACTION.MANAGE },
  { resource: RESOURCE.LIBRO_ACTAS, action: ACTION.MANAGE },
]);

addRole('TESORERIA', 'Gestión financiera', [
  { resource: RESOURCE.PAGO, action: ACTION.MANAGE },
  { resource: RESOURCE.CUENTA_DINERO, action: ACTION.MANAGE },
  { resource: RESOURCE.PRESUPUESTO, action: ACTION.MANAGE },
]);

addRole('MIEMBRO_ACTIVO', 'Participante con acceso de lectura', [
  { resource: RESOURCE.PROTAGONISTA, action: ACTION.READ },
  { resource: RESOURCE.EVENTO, action: ACTION.READ },
]);

addRole('FAMILIA', 'Responsable/familia con lectura acotada', [
  { resource: RESOURCE.PROTAGONISTA, action: ACTION.READ },
  { resource: RESOURCE.PAGO, action: ACTION.READ },
]);

async function seedAreas() {
  const areas = await Promise.all(
    areaSeeds.map((area) =>
      prisma.area.upsert({
        where: { nombre: area.nombre },
        update: { descripcion: area.descripcion ?? '' },
        create: { nombre: area.nombre, descripcion: area.descripcion ?? '' },
      }),
    ),
  );

  return areas.reduce<Record<string, number>>((acc, area) => {
    acc[area.nombre] = area.id;
    return acc;
  }, {});
}

async function seedRamas(idAreaRama: number) {
  return Promise.all(
    ramaSeeds.map((rama) =>
      prisma.rama.upsert({
        where: { nombre: rama.nombre },
        update: {
          edad_minima_protagonistas: rama.edad_minima_protagonistas,
          edad_maxima_protagonistas: rama.edad_maxima_protagonistas,
          edad_minima_adulto: rama.edad_minima_adulto,
          id_area: idAreaRama,
        },
        create: {
          borrado: false,
          nombre: rama.nombre,
          edad_minima_protagonistas: rama.edad_minima_protagonistas,
          edad_maxima_protagonistas: rama.edad_maxima_protagonistas,
          edad_minima_adulto: rama.edad_minima_adulto,
          id_area: idAreaRama,
        },
      }),
    ),
  );
}

async function seedPermissions(): Promise<Record<string, number>> {
  const permissions: Record<string, number> = {};

  for (const resource of allResources) {
    const actions = readOnlyResources.includes(resource as RESOURCE)
      ? [ACTION.READ]
      : [
          ACTION.CREATE,
          ACTION.READ,
          ACTION.UPDATE,
          ACTION.DELETE,
          ACTION.MANAGE,
        ];

    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: { action_resource: { action, resource } },
        update: {},
        create: { action, resource },
      });
      permissions[`${resource}:${action}`] = permission.id;
    }
  }

  return permissions;
}

async function seedRoles(permissionIndex: Record<string, number>) {
  for (const role of roleDefinitions) {
    const roleRecord = await prisma.role.upsert({
      where: { nombre: role.nombre },
      update: { descripcion: role.descripcion },
      create: { nombre: role.nombre, descripcion: role.descripcion },
    });

    for (const perm of role.permissions) {
      const key = `${perm.resource}:${perm.action}`;
      const permissionId = permissionIndex[key];
      if (!permissionId) {
        console.warn(`Permiso no encontrado para clave ${key}, omitiendo`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          id_role_id_permission: {
            id_role: roleRecord.id,
            id_permission: permissionId,
          },
        },
        update: {},
        create: {
          id_role: roleRecord.id,
          id_permission: permissionId,
        },
      });
    }
  }
}

async function main() {
  const areaIndex = await seedAreas();
  const areaRamaId = areaIndex[AREAS.RAMA];
  if (!areaRamaId) {
    throw new Error('No se encontró el área de RAMA para asignar a las ramas');
  }

  await seedRamas(areaRamaId);
  const permissionIndex = await seedPermissions();
  await seedRoles(permissionIndex);
  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
