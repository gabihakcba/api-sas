/*
  Warnings:

  - You are about to drop the column `roleId` on the `CuentaRole` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Role` table. All the data in the column will be lost.
  - The primary key for the `RolePermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `permissionId` on the `RolePermission` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `RolePermission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_role` to the `CuentaRole` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_permission` to the `RolePermission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_role` to the `RolePermission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `CuentaRole` DROP FOREIGN KEY `CuentaRole_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `RolePermission` DROP FOREIGN KEY `RolePermission_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `RolePermission` DROP FOREIGN KEY `RolePermission_roleId_fkey`;

-- DropIndex
DROP INDEX `CuentaRole_roleId_fkey` ON `CuentaRole`;

-- DropIndex
DROP INDEX `Permission_name_key` ON `Permission`;

-- DropIndex
DROP INDEX `Role_name_key` ON `Role`;

-- DropIndex
DROP INDEX `RolePermission_permissionId_fkey` ON `RolePermission`;

-- AlterTable
ALTER TABLE `CuentaRole` DROP COLUMN `roleId`,
    ADD COLUMN `id_role` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Permission` DROP COLUMN `description`,
    DROP COLUMN `level`,
    DROP COLUMN `name`,
    ADD COLUMN `descripcion` VARCHAR(191) NULL,
    ADD COLUMN `nombre` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Role` DROP COLUMN `description`,
    DROP COLUMN `name`,
    ADD COLUMN `descripcion` VARCHAR(191) NULL,
    ADD COLUMN `nombre` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `RolePermission` DROP PRIMARY KEY,
    DROP COLUMN `permissionId`,
    DROP COLUMN `roleId`,
    ADD COLUMN `id_permission` INTEGER NOT NULL,
    ADD COLUMN `id_role` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id_role`, `id_permission`);

-- CreateIndex
CREATE UNIQUE INDEX `Permission_nombre_key` ON `Permission`(`nombre`);

-- CreateIndex
CREATE UNIQUE INDEX `Role_nombre_key` ON `Role`(`nombre`);

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_id_role_fkey` FOREIGN KEY (`id_role`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_id_permission_fkey` FOREIGN KEY (`id_permission`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuentaRole` ADD CONSTRAINT `CuentaRole_id_role_fkey` FOREIGN KEY (`id_role`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
