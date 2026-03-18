/*
  Warnings:

  - You are about to drop the column `theme` on the `ConfiguracionGrupo` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "RESOURCE" ADD VALUE 'CONFIGURACION_GRUPO';

-- AlterTable
ALTER TABLE "ConfiguracionGrupo" DROP COLUMN "theme",
ADD COLUMN     "theme_mobile" TEXT NOT NULL DEFAULT 'md3-light',
ADD COLUMN     "theme_web" TEXT NOT NULL DEFAULT 'lara-light-blue';
