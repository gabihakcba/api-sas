/*
  Warnings:

  - You are about to drop the `ActividadResponsable` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActividadResponsable" DROP CONSTRAINT "ActividadResponsable_id_actividad_fkey";

-- DropForeignKey
ALTER TABLE "ActividadResponsable" DROP CONSTRAINT "ActividadResponsable_id_adulto_fkey";

-- DropTable
DROP TABLE "ActividadResponsable";

-- CreateTable
CREATE TABLE "ActividadSabatinoResponsable" (
    "id_actividad" INTEGER NOT NULL,
    "id_sabatino" INTEGER NOT NULL,
    "id_adulto" INTEGER NOT NULL,

    CONSTRAINT "ActividadSabatinoResponsable_pkey" PRIMARY KEY ("id_actividad","id_sabatino","id_adulto")
);

-- AddForeignKey
ALTER TABLE "ActividadSabatinoResponsable" ADD CONSTRAINT "ActividadSabatinoResponsable_id_actividad_id_sabatino_fkey" FOREIGN KEY ("id_actividad", "id_sabatino") REFERENCES "ActividadSabatino"("id_actividad", "id_sabatino") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadSabatinoResponsable" ADD CONSTRAINT "ActividadSabatinoResponsable_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
