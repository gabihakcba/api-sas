/*
  Warnings:

  - You are about to drop the column `fecha` on the `Actividad` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Actividad" DROP COLUMN "fecha";

-- AlterTable
ALTER TABLE "ActividadSabatino" ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "numero" INTEGER;
