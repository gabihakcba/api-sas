-- CreateEnum
CREATE TYPE "MODALIDAD_REUNION" AS ENUM ('PRESENCIAL', 'VIRTUAL', 'HIBRIDA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RESOURCE" ADD VALUE 'REUNION';
ALTER TYPE "RESOURCE" ADD VALUE 'INVITADO_REUNION';

-- CreateTable
CREATE TABLE "Reunion" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "modalidad" "MODALIDAD_REUNION" NOT NULL DEFAULT 'PRESENCIAL',
    "lugar_fisico" TEXT,
    "url_virtual" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reunion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitadoReunion" (
    "id" SERIAL NOT NULL,
    "asistio" BOOLEAN NOT NULL DEFAULT false,
    "confirmo" BOOLEAN,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_reunion" INTEGER NOT NULL,
    "id_miembro" INTEGER NOT NULL,

    CONSTRAINT "InvitadoReunion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaAfectadaReunion" (
    "id" SERIAL NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_reunion" INTEGER NOT NULL,
    "id_area" INTEGER NOT NULL,

    CONSTRAINT "AreaAfectadaReunion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RamaAfectadaReunion" (
    "id" SERIAL NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_reunion" INTEGER NOT NULL,
    "id_rama" INTEGER NOT NULL,

    CONSTRAINT "RamaAfectadaReunion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvitadoReunion_id_miembro_idx" ON "InvitadoReunion"("id_miembro");

-- CreateIndex
CREATE INDEX "InvitadoReunion_id_reunion_borrado_idx" ON "InvitadoReunion"("id_reunion", "borrado");

-- CreateIndex
CREATE UNIQUE INDEX "InvitadoReunion_id_reunion_id_miembro_key" ON "InvitadoReunion"("id_reunion", "id_miembro");

-- CreateIndex
CREATE INDEX "AreaAfectadaReunion_id_area_idx" ON "AreaAfectadaReunion"("id_area");

-- CreateIndex
CREATE UNIQUE INDEX "AreaAfectadaReunion_id_reunion_id_area_key" ON "AreaAfectadaReunion"("id_reunion", "id_area");

-- CreateIndex
CREATE INDEX "RamaAfectadaReunion_id_rama_idx" ON "RamaAfectadaReunion"("id_rama");

-- CreateIndex
CREATE UNIQUE INDEX "RamaAfectadaReunion_id_reunion_id_rama_key" ON "RamaAfectadaReunion"("id_reunion", "id_rama");

-- AddForeignKey
ALTER TABLE "InvitadoReunion" ADD CONSTRAINT "InvitadoReunion_id_reunion_fkey" FOREIGN KEY ("id_reunion") REFERENCES "Reunion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitadoReunion" ADD CONSTRAINT "InvitadoReunion_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaAfectadaReunion" ADD CONSTRAINT "AreaAfectadaReunion_id_reunion_fkey" FOREIGN KEY ("id_reunion") REFERENCES "Reunion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaAfectadaReunion" ADD CONSTRAINT "AreaAfectadaReunion_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RamaAfectadaReunion" ADD CONSTRAINT "RamaAfectadaReunion_id_reunion_fkey" FOREIGN KEY ("id_reunion") REFERENCES "Reunion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RamaAfectadaReunion" ADD CONSTRAINT "RamaAfectadaReunion_id_rama_fkey" FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
