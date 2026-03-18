import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as never);
const prisma = new PrismaClient({ adapter });

type PublicTable = {
  tablename: string;
};

async function main() {
  console.log('Iniciando anti-seed...');

  const tables = await prisma.$queryRaw<PublicTable[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename ASC
  `;

  if (tables.length === 0) {
    console.log('No se encontraron tablas para limpiar.');
    return;
  }

  const truncateStatement = tables
    .map((table) => `"public"."${table.tablename}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${truncateStatement} RESTART IDENTITY CASCADE;`,
  );

  console.log(
    `Anti-seed completado. Se limpiaron ${tables.length} tablas del esquema public.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Error en el anti-seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
