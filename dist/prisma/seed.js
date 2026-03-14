"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const CRUD_ACTIONS = [
    client_1.ACTION.CREATE,
    client_1.ACTION.READ,
    client_1.ACTION.UPDATE,
    client_1.ACTION.DELETE,
];
const ALL_RESOURCES = Object.values(client_1.RESOURCE);
const SECRETARIA_TESORERIA_RESOURCES = [
    client_1.RESOURCE.CUENTA,
    client_1.RESOURCE.MIEMBRO,
    client_1.RESOURCE.PROTAGONISTA,
    client_1.RESOURCE.ADULTO,
    client_1.RESOURCE.RESPONSABLE,
    client_1.RESOURCE.RELACION,
    client_1.RESOURCE.PAGO,
    client_1.RESOURCE.CONCEPTO_PAGO,
    client_1.RESOURCE.METODO_PAGO,
    client_1.RESOURCE.CUENTA_DINERO,
    client_1.RESOURCE.PRESUPUESTO,
    client_1.RESOURCE.EVENTO,
    client_1.RESOURCE.INSCRIPCION,
    client_1.RESOURCE.TIPO_EVENTO,
];
const ADULTO_READONLY_RESOURCES = [client_1.RESOURCE.ADULTO];
const INTENDENCIA_READONLY_RESOURCES = [
    client_1.RESOURCE.MIEMBRO,
    client_1.RESOURCE.ADULTO,
];
const RAMA_FULL_ACCESS_RESOURCES = [
    client_1.RESOURCE.MIEMBRO,
    client_1.RESOURCE.PROTAGONISTA,
    client_1.RESOURCE.RELACION,
    client_1.RESOURCE.EVENTO,
    client_1.RESOURCE.INSCRIPCION,
    client_1.RESOURCE.ASISTENCIA,
    client_1.RESOURCE.COMISION,
    client_1.RESOURCE.PARTICIPANTE_COMISION,
    client_1.RESOURCE.CUENTA_DINERO,
    client_1.RESOURCE.PAGO,
];
const RAMA_READONLY_RESOURCES = [
    client_1.RESOURCE.ADULTO,
    client_1.RESOURCE.RESPONSABLE,
    client_1.RESOURCE.PLAN_FORMACION,
];
const AREA_DEFINITIONS = [
    {
        nombre: 'Jefatura',
        descripcion: 'Compuesta por jefe o jefa y subjefe o subjefa del grupo. Representa al grupo ante otros grupos scout y consejos de zona y distrito.',
    },
    {
        nombre: 'Secretaria y Tesoreria',
        descripcion: 'Gestiona la inscripcion de miembros, cuotas y afiliaciones a la organizacion scout.',
    },
    {
        nombre: 'Intendencia',
        descripcion: 'Administra y mantiene materiales, insumos y mejoras edilicias, brindando apoyo material al resto de las areas.',
    },
    {
        nombre: 'Rama',
        descripcion: 'Area contenedora de las ramas educativas y de sus equipos de educadores adultos.',
    },
];
const RAMA_DEFINITIONS = [
    {
        nombre: 'Castores',
        descripcion: 'Rama para protagonistas de 4 a 6 anos.',
        edad_minima_protagonistas: 4,
        edad_maxima_protagonistas: 6,
        edad_minima_adulto: 22,
    },
    {
        nombre: 'Manada',
        descripcion: 'Rama para protagonistas de 7 a 9 anos.',
        edad_minima_protagonistas: 7,
        edad_maxima_protagonistas: 9,
        edad_minima_adulto: 22,
    },
    {
        nombre: 'Unidad',
        descripcion: 'Rama para protagonistas de 10 a 13 anos.',
        edad_minima_protagonistas: 10,
        edad_maxima_protagonistas: 13,
        edad_minima_adulto: 22,
    },
    {
        nombre: 'Caminantes',
        descripcion: 'Rama para protagonistas de 14 a 17 anos.',
        edad_minima_protagonistas: 14,
        edad_maxima_protagonistas: 17,
        edad_minima_adulto: 25,
    },
    {
        nombre: 'Rovers',
        descripcion: 'Rama para protagonistas de 18 a 22 anos.',
        edad_minima_protagonistas: 18,
        edad_maxima_protagonistas: 22,
        edad_minima_adulto: 25,
    },
];
const POSICION_AREA_DEFINITIONS = [
    {
        nombre: 'Jefe',
        descripcion: 'Responsable principal del area o rama.',
    },
    {
        nombre: 'Subjefe',
        descripcion: 'Acompana la conduccion del area o rama y reemplaza al jefe cuando sea necesario.',
    },
    {
        nombre: 'Secretario',
        descripcion: 'Gestiona tareas administrativas, registros y documentacion.',
    },
    {
        nombre: 'Tesorero',
        descripcion: 'Administra cuotas, pagos y control economico del area.',
    },
    {
        nombre: 'Ayudante',
        descripcion: 'Colabora con el equipo educativo o de gestion segun las necesidades del area.',
    },
];
const CONCEPTO_PAGO_DEFINITIONS = [
    {
        nombre: 'Evento',
        descripcion: 'Cobros vinculados a actividades, campamentos y eventos.',
    },
    {
        nombre: 'Cuota',
        descripcion: 'Cobros periodicos correspondientes a la cuota del grupo.',
    },
    {
        nombre: 'Afiliacion',
        descripcion: 'Cobros asociados al proceso de afiliacion institucional.',
    },
];
const METODO_PAGO_DEFINITIONS = [
    {
        nombre: 'Transferencia',
        descripcion: 'Pago realizado mediante transferencia bancaria.',
    },
    {
        nombre: 'Efectivo',
        descripcion: 'Pago realizado en efectivo.',
    },
    {
        nombre: 'Debito',
        descripcion: 'Pago realizado con tarjeta de debito.',
    },
    {
        nombre: 'Cheque',
        descripcion: 'Pago documentado mediante cheque.',
    },
];
const PROTAGONISTA_READONLY_RESOURCES = [client_1.RESOURCE.CUENTA_DINERO];
const RAMA_ROLE_PERMISSIONS = [
    {
        actions: CRUD_ACTIONS,
        resources: RAMA_FULL_ACCESS_RESOURCES,
    },
    {
        actions: [client_1.ACTION.READ],
        resources: RAMA_READONLY_RESOURCES,
    },
];
const ADULT_CONCEPTO_PAGO_PERMISSIONS = {
    actions: CRUD_ACTIONS,
    resources: [client_1.RESOURCE.CONCEPTO_PAGO],
};
const ADULT_METODO_PAGO_PERMISSIONS = {
    actions: CRUD_ACTIONS,
    resources: [client_1.RESOURCE.METODO_PAGO],
};
const ADULT_CUENTA_DINERO_PERMISSIONS = {
    actions: CRUD_ACTIONS,
    resources: [client_1.RESOURCE.CUENTA_DINERO],
};
const ADULT_CONSEJO_PERMISSIONS = {
    actions: CRUD_ACTIONS,
    resources: [client_1.RESOURCE.CONSEJO],
};
const ROLE_DEFINITIONS = [
    {
        nombre: 'ADM',
        descripcion: 'Superusuario tecnico con acceso total a todos los recursos del sistema.',
        permissions: [
            {
                actions: [client_1.ACTION.MANAGE],
                resources: ALL_RESOURCES,
            },
        ],
    },
    {
        nombre: 'PROTAGONISTA',
        descripcion: 'Acceso personal a su caja y a la caja de la rama segun las reglas de filtrado del backend.',
        permissions: [
            {
                actions: [client_1.ACTION.READ],
                resources: PROTAGONISTA_READONLY_RESOURCES,
            },
        ],
    },
    {
        nombre: 'JEFATURA',
        descripcion: 'Acceso total a las herramientas del sistema con capacidad de realizar modificaciones.',
        permissions: [
            {
                actions: [client_1.ACTION.MANAGE],
                resources: ALL_RESOURCES,
            },
            ADULT_CONCEPTO_PAGO_PERMISSIONS,
            ADULT_METODO_PAGO_PERMISSIONS,
            ADULT_CUENTA_DINERO_PERMISSIONS,
            ADULT_CONSEJO_PERMISSIONS,
        ],
    },
    {
        nombre: 'SECRETARIA_TESORERIA',
        descripcion: 'Acceso completo al area de pagos, eventos, inscripciones y gestion de miembros.',
        permissions: [
            {
                actions: CRUD_ACTIONS,
                resources: SECRETARIA_TESORERIA_RESOURCES,
            },
            {
                actions: [client_1.ACTION.READ],
                resources: ADULTO_READONLY_RESOURCES,
            },
            ADULT_CONCEPTO_PAGO_PERMISSIONS,
            ADULT_METODO_PAGO_PERMISSIONS,
            ADULT_CUENTA_DINERO_PERMISSIONS,
        ],
    },
    {
        nombre: 'JEFATURA_RAMA',
        descripcion: 'Acceso total a la informacion y edicion correspondiente a su rama.',
        permissions: [
            ...RAMA_ROLE_PERMISSIONS,
            ADULT_CONCEPTO_PAGO_PERMISSIONS,
            ADULT_METODO_PAGO_PERMISSIONS,
            ADULT_CUENTA_DINERO_PERMISSIONS,
            ADULT_CONSEJO_PERMISSIONS,
        ],
    },
    {
        nombre: 'AYUDANTE_RAMA',
        descripcion: 'Mismos permisos exactos que Jefatura de Rama para mantener la gestion horizontal.',
        permissions: [
            ...RAMA_ROLE_PERMISSIONS,
            ADULT_CONCEPTO_PAGO_PERMISSIONS,
            ADULT_METODO_PAGO_PERMISSIONS,
            ADULT_CUENTA_DINERO_PERMISSIONS,
            ADULT_CONSEJO_PERMISSIONS,
        ],
    },
    {
        nombre: 'INTENDENCIA',
        descripcion: 'Acceso de lectura al padron adulto para coordinacion operativa del area.',
        permissions: [
            {
                actions: [client_1.ACTION.READ],
                resources: INTENDENCIA_READONLY_RESOURCES,
            },
            ADULT_CONCEPTO_PAGO_PERMISSIONS,
            ADULT_METODO_PAGO_PERMISSIONS,
            ADULT_CUENTA_DINERO_PERMISSIONS,
            ADULT_CONSEJO_PERMISSIONS,
        ],
    },
];
const ADMIN_DNI = '00000000';
function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Falta la variable de entorno ${name} para ejecutar el seed del usuario admin.`);
    }
    return value;
}
function buildPermissionKey(action, resource) {
    return `${action}:${resource}`;
}
async function seedRolesAndPermissions(tx) {
    console.log('Creando roles y permisos base...');
    for (const role of ROLE_DEFINITIONS) {
        await tx.role.upsert({
            where: { nombre: role.nombre },
            update: { descripcion: role.descripcion },
            create: {
                nombre: role.nombre,
                descripcion: role.descripcion,
            },
        });
    }
    const permissionMap = new Map();
    for (const role of ROLE_DEFINITIONS) {
        for (const permissionGroup of role.permissions) {
            for (const action of permissionGroup.actions) {
                for (const resource of permissionGroup.resources) {
                    permissionMap.set(buildPermissionKey(action, resource), {
                        action,
                        resource,
                    });
                }
            }
        }
    }
    const permissionsToCreate = Array.from(permissionMap.values());
    if (permissionsToCreate.length > 0) {
        await tx.permission.createMany({
            data: permissionsToCreate,
            skipDuplicates: true,
        });
    }
    const roles = await tx.role.findMany({
        where: {
            nombre: {
                in: ROLE_DEFINITIONS.map((role) => role.nombre),
            },
        },
    });
    const roleIdByName = new Map(roles.map((role) => [role.nombre, role.id]));
    const permissions = await tx.permission.findMany({
        where: {
            OR: permissionsToCreate.map((permission) => ({
                action: permission.action,
                resource: permission.resource,
            })),
        },
    });
    const permissionIdByKey = new Map(permissions.map((permission) => [
        buildPermissionKey(permission.action, permission.resource),
        permission.id,
    ]));
    await tx.rolePermission.deleteMany({
        where: {
            id_role: {
                in: Array.from(roleIdByName.values()),
            },
        },
    });
    const rolePermissionsToCreate = ROLE_DEFINITIONS.flatMap((role) => {
        const roleId = roleIdByName.get(role.nombre);
        if (!roleId) {
            throw new Error(`No se pudo resolver el rol ${role.nombre} durante el seed.`);
        }
        return role.permissions.flatMap((permissionGroup) => permissionGroup.actions.flatMap((action) => permissionGroup.resources.map((resource) => {
            const permissionId = permissionIdByKey.get(buildPermissionKey(action, resource));
            if (!permissionId) {
                throw new Error(`No se pudo resolver el permiso ${buildPermissionKey(action, resource)} durante el seed.`);
            }
            return {
                id_role: roleId,
                id_permission: permissionId,
            };
        })));
    });
    if (rolePermissionsToCreate.length > 0) {
        await tx.rolePermission.createMany({
            data: rolePermissionsToCreate,
            skipDuplicates: true,
        });
    }
    return roleIdByName;
}
async function seedAreasAndRamas(tx) {
    console.log('Creando areas y ramas base...');
    for (const area of AREA_DEFINITIONS) {
        await tx.area.upsert({
            where: { nombre: area.nombre },
            update: { descripcion: area.descripcion },
            create: {
                nombre: area.nombre,
                descripcion: area.descripcion,
            },
        });
    }
    const areaRama = await tx.area.findUnique({
        where: { nombre: 'Rama' },
    });
    if (!areaRama) {
        throw new Error('No se pudo resolver el area Rama durante el seed.');
    }
    for (const rama of RAMA_DEFINITIONS) {
        await tx.rama.upsert({
            where: { nombre: rama.nombre },
            update: {
                descripcion: rama.descripcion,
                edad_minima_protagonistas: rama.edad_minima_protagonistas,
                edad_maxima_protagonistas: rama.edad_maxima_protagonistas,
                edad_minima_adulto: rama.edad_minima_adulto,
                id_area: areaRama.id,
            },
            create: {
                nombre: rama.nombre,
                descripcion: rama.descripcion,
                edad_minima_protagonistas: rama.edad_minima_protagonistas,
                edad_maxima_protagonistas: rama.edad_maxima_protagonistas,
                edad_minima_adulto: rama.edad_minima_adulto,
                id_area: areaRama.id,
            },
        });
    }
}
async function seedPosicionesArea(tx) {
    console.log('Creando posiciones de area base...');
    for (const posicion of POSICION_AREA_DEFINITIONS) {
        await tx.posicionArea.upsert({
            where: { nombre: posicion.nombre },
            update: { descripcion: posicion.descripcion },
            create: {
                nombre: posicion.nombre,
                descripcion: posicion.descripcion,
            },
        });
    }
}
async function seedConceptosPago(tx) {
    console.log('Creando conceptos de pago base...');
    for (const conceptoPago of CONCEPTO_PAGO_DEFINITIONS) {
        const existing = await tx.conceptoPago.findFirst({
            where: {
                nombre: conceptoPago.nombre,
            },
            select: {
                id: true,
            },
        });
        if (existing) {
            await tx.conceptoPago.update({
                where: { id: existing.id },
                data: {
                    descripcion: conceptoPago.descripcion,
                    borrado: false,
                },
            });
            continue;
        }
        await tx.conceptoPago.create({
            data: {
                nombre: conceptoPago.nombre,
                descripcion: conceptoPago.descripcion,
            },
        });
    }
}
async function seedMetodosPago(tx) {
    console.log('Creando metodos de pago base...');
    for (const metodoPago of METODO_PAGO_DEFINITIONS) {
        const existing = await tx.metodoPago.findFirst({
            where: {
                nombre: metodoPago.nombre,
            },
            select: {
                id: true,
            },
        });
        if (existing) {
            await tx.metodoPago.update({
                where: { id: existing.id },
                data: {
                    descripcion: metodoPago.descripcion,
                    borrado: false,
                },
            });
            continue;
        }
        await tx.metodoPago.create({
            data: {
                nombre: metodoPago.nombre,
                descripcion: metodoPago.descripcion,
            },
        });
    }
}
async function seedCuentasDineroBase(tx) {
    console.log('Creando cuentas de dinero base...');
    const areaJefatura = await tx.area.findFirst({
        where: {
            nombre: 'Jefatura',
            borrado: false,
        },
        select: {
            id: true,
            nombre: true,
        },
    });
    if (!areaJefatura) {
        throw new Error('No se pudo resolver el area Jefatura durante el seed.');
    }
    const ramas = await tx.rama.findMany({
        where: {
            borrado: false,
        },
        orderBy: {
            nombre: 'asc',
        },
        select: {
            id: true,
            nombre: true,
        },
    });
    const cuentaGeneral = await tx.cuentaDinero.findFirst({
        where: {
            nombre: 'Caja General Grupo',
        },
        select: {
            id: true,
        },
    });
    if (cuentaGeneral) {
        await tx.cuentaDinero.update({
            where: { id: cuentaGeneral.id },
            data: {
                descripcion: 'Cuenta general del grupo administrada por Jefatura.',
                id_area: areaJefatura.id,
                id_rama: null,
                id_miembro: null,
                borrado: false,
            },
        });
    }
    else {
        await tx.cuentaDinero.create({
            data: {
                nombre: 'Caja General Grupo',
                descripcion: 'Cuenta general del grupo administrada por Jefatura.',
                id_area: areaJefatura.id,
            },
        });
    }
    for (const rama of ramas) {
        const existing = await tx.cuentaDinero.findFirst({
            where: {
                id_rama: rama.id,
                id_miembro: null,
            },
            select: {
                id: true,
            },
        });
        const data = {
            nombre: `Caja ${rama.nombre}`,
            descripcion: `Cuenta de dinero asociada a la rama ${rama.nombre}.`,
            id_area: null,
            id_rama: rama.id,
            id_miembro: null,
            borrado: false,
        };
        if (existing) {
            await tx.cuentaDinero.update({
                where: { id: existing.id },
                data,
            });
            continue;
        }
        await tx.cuentaDinero.create({ data });
    }
}
async function seedAdminAccount(tx, roleIdByName) {
    console.log('Creando usuario admin...');
    const adminUser = getRequiredEnv('SEED_ADMIN_USER');
    const adminEmail = getRequiredEnv('SEED_ADMIN_EMAIL');
    const adminPassword = getRequiredEnv('SEED_ADMIN_PASSWORD');
    const jefaturaRoleId = roleIdByName.get('JEFATURA');
    const admRoleId = roleIdByName.get('ADM');
    if (!jefaturaRoleId || !admRoleId) {
        throw new Error('Los roles JEFATURA y ADM son obligatorios para crear el usuario admin.');
    }
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const cuentaByUser = await tx.cuenta.findUnique({
        where: { user: adminUser },
    });
    const miembro = await tx.miembro.findUnique({
        where: { dni: ADMIN_DNI },
    });
    if (miembro && cuentaByUser && miembro.id_cuenta !== cuentaByUser.id) {
        throw new Error(`El usuario admin ${adminUser} ya existe en otra cuenta distinta a la vinculada al DNI ${ADMIN_DNI}. Regulariza ese conflicto antes de reintentar el seed.`);
    }
    let cuenta = cuentaByUser;
    if (!cuenta && miembro) {
        cuenta = await tx.cuenta.findUnique({
            where: { id: miembro.id_cuenta },
        });
    }
    if (!cuenta) {
        cuenta = await tx.cuenta.create({
            data: {
                user: adminUser,
                password: hashedPassword,
            },
        });
    }
    else {
        cuenta = await tx.cuenta.update({
            where: { id: cuenta.id },
            data: {
                user: adminUser,
                password: hashedPassword,
                borrado: false,
            },
        });
    }
    if (!miembro) {
        await tx.miembro.create({
            data: {
                nombre: 'Super',
                apellidos: 'Admin',
                dni: ADMIN_DNI,
                fecha_nacimiento: new Date('1990-01-01'),
                direccion: 'Calle Falsa 123',
                email: adminEmail,
                telefono_emergencia: '911',
                id_cuenta: cuenta.id,
            },
        });
    }
    else {
        await tx.miembro.update({
            where: { id: miembro.id },
            data: {
                email: adminEmail,
                borrado: false,
            },
        });
    }
    const adminRoleAssignment = await tx.cuentaRole.findFirst({
        where: {
            id_cuenta: cuenta.id,
            id_role: jefaturaRoleId,
            tipo_scope: client_1.SCOPE.GLOBAL,
            id_scope: null,
        },
    });
    if (!adminRoleAssignment) {
        await tx.cuentaRole.create({
            data: {
                id_cuenta: cuenta.id,
                id_role: jefaturaRoleId,
                tipo_scope: client_1.SCOPE.GLOBAL,
            },
        });
    }
    const admRoleAssignment = await tx.cuentaRole.findFirst({
        where: {
            id_cuenta: cuenta.id,
            id_role: admRoleId,
            tipo_scope: client_1.SCOPE.GLOBAL,
            id_scope: null,
        },
    });
    if (!admRoleAssignment) {
        await tx.cuentaRole.create({
            data: {
                id_cuenta: cuenta.id,
                id_role: admRoleId,
                tipo_scope: client_1.SCOPE.GLOBAL,
            },
        });
    }
}
async function main() {
    console.log('Iniciando seed...');
    await prisma.$transaction(async (tx) => {
        const roleIdByName = await seedRolesAndPermissions(tx);
        await seedAreasAndRamas(tx);
        await seedPosicionesArea(tx);
        await seedConceptosPago(tx);
        await seedMetodosPago(tx);
        await seedCuentasDineroBase(tx);
        await seedAdminAccount(tx, roleIdByName);
    });
    console.log('Seed completado con exito.');
}
main()
    .catch((error) => {
    console.error('Error en el seed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed.js.map