/*
  Warnings:

  - You are about to drop the `TipoPago` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Pago` DROP FOREIGN KEY `Pago_id_tipo_pago_fkey`;

-- DropIndex
DROP INDEX `Pago_id_tipo_pago_fkey` ON `Pago`;

-- DropTable
DROP TABLE `TipoPago`;

-- CreateTable
CREATE TABLE `ConceptoPago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_id_tipo_pago_fkey` FOREIGN KEY (`id_tipo_pago`) REFERENCES `ConceptoPago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
