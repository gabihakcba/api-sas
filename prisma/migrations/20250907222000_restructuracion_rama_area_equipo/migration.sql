/*
  Warnings:

  - You are about to drop the column `id_rama` on the `Area` table. All the data in the column will be lost.
  - Added the required column `id_area` to the `Rama` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Area` DROP FOREIGN KEY `Area_id_rama_fkey`;

-- DropIndex
DROP INDEX `Area_id_rama_key` ON `Area`;

-- AlterTable
ALTER TABLE `Area` DROP COLUMN `id_rama`;

-- AlterTable
ALTER TABLE `EquipoArea` ADD COLUMN `id_rama` INTEGER NULL;

-- AlterTable
ALTER TABLE `Rama` ADD COLUMN `id_area` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `EquipoArea` ADD CONSTRAINT `EquipoArea_id_rama_fkey` FOREIGN KEY (`id_rama`) REFERENCES `Rama`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rama` ADD CONSTRAINT `Rama_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `Area`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
