-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RESOURCE" ADD VALUE 'SABATINO';
ALTER TYPE "RESOURCE" ADD VALUE 'PROGRAMA';
ALTER TYPE "RESOURCE" ADD VALUE 'ACTIVIDAD';
ALTER TYPE "RESOURCE" ADD VALUE 'TIPO_ACTIVIDAD';

-- CreateTable
CREATE TABLE "TipoActividad" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT DEFAULT '#FFFFFF',

    CONSTRAINT "TipoActividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "numero" INTEGER,
    "objetivos" TEXT,
    "materiales" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_tipo" INTEGER NOT NULL,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActividadResponsable" (
    "id_actividad" INTEGER NOT NULL,
    "id_adulto" INTEGER NOT NULL,

    CONSTRAINT "ActividadResponsable_pkey" PRIMARY KEY ("id_actividad","id_adulto")
);

-- CreateTable
CREATE TABLE "Sabatino" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sabatino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActividadEducadorSabatino" (
    "id_sabatino" INTEGER NOT NULL,
    "id_adulto" INTEGER NOT NULL,

    CONSTRAINT "ActividadEducadorSabatino_pkey" PRIMARY KEY ("id_sabatino","id_adulto")
);

-- CreateTable
CREATE TABLE "ActividadSabatino" (
    "id_actividad" INTEGER NOT NULL,
    "id_sabatino" INTEGER NOT NULL,

    CONSTRAINT "ActividadSabatino_pkey" PRIMARY KEY ("id_actividad","id_sabatino")
);

-- CreateTable
CREATE TABLE "RamaAfectadaSabatino" (
    "id_rama" INTEGER NOT NULL,
    "id_sabatino" INTEGER NOT NULL,

    CONSTRAINT "RamaAfectadaSabatino_pkey" PRIMARY KEY ("id_rama","id_sabatino")
);

-- CreateTable
CREATE TABLE "AreaAfectadaSabatino" (
    "id_area" INTEGER NOT NULL,
    "id_sabatino" INTEGER NOT NULL,

    CONSTRAINT "AreaAfectadaSabatino_pkey" PRIMARY KEY ("id_area","id_sabatino")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoActividad_nombre_key" ON "TipoActividad"("nombre");

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoActividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadResponsable" ADD CONSTRAINT "ActividadResponsable_id_actividad_fkey" FOREIGN KEY ("id_actividad") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadResponsable" ADD CONSTRAINT "ActividadResponsable_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadEducadorSabatino" ADD CONSTRAINT "ActividadEducadorSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadEducadorSabatino" ADD CONSTRAINT "ActividadEducadorSabatino_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadSabatino" ADD CONSTRAINT "ActividadSabatino_id_actividad_fkey" FOREIGN KEY ("id_actividad") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadSabatino" ADD CONSTRAINT "ActividadSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RamaAfectadaSabatino" ADD CONSTRAINT "RamaAfectadaSabatino_id_rama_fkey" FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RamaAfectadaSabatino" ADD CONSTRAINT "RamaAfectadaSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaAfectadaSabatino" ADD CONSTRAINT "AreaAfectadaSabatino_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaAfectadaSabatino" ADD CONSTRAINT "AreaAfectadaSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
