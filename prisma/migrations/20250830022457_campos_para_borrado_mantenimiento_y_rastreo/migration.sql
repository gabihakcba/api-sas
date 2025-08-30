/*
  Warnings:

  - You are about to drop the column `id_registro` on the `Action` table. All the data in the column will be lost.
  - You are about to drop the column `post` on the `Action` table. All the data in the column will be lost.
  - You are about to drop the column `pre` on the `Action` table. All the data in the column will be lost.
  - Added the required column `pre_registro` to the `Action` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AsistenciaConsejo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Certificado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FormacionAdultos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ParticipantesComision` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Responsabilidad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TemarioConsejo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Action` DROP COLUMN `id_registro`,
    DROP COLUMN `post`,
    DROP COLUMN `pre`,
    ADD COLUMN `post_resgistro` JSON NULL,
    ADD COLUMN `pre_registro` JSON NOT NULL;

-- AlterTable
ALTER TABLE `AsistenciaConsejo` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Certificado` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Comision` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Consejo` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `CuentaDinero` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Evento` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `FormacionAdultos` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `InscripcionEvento` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `MetodoPago` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Pago` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ParticipantesComision` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `PlanFormacion` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Responsabilidad` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `TemarioConsejo` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `TipoPago` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;
