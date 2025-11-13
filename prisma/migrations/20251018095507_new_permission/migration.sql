/*
  Warnings:

  - You are about to drop the column `descripcion` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Permission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[action]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[action,resource]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_scope` to the `RolePermission` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Permission_nombre_key` ON `Permission`;

-- AlterTable
ALTER TABLE `Permission` DROP COLUMN `descripcion`,
    DROP COLUMN `nombre`,
    ADD COLUMN `action` ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE') NOT NULL,
    ADD COLUMN `resource` ENUM('CUENTA', 'MIEMBRO', 'PROTAGONISTA', 'ADULTO', 'RESPONSABLE', 'PAGO') NOT NULL;

-- AlterTable
ALTER TABLE `RolePermission` ADD COLUMN `id_scope` INTEGER NULL,
    ADD COLUMN `tipo_scope` ENUM('GRUPO', 'RAMA', 'GLOBAL', 'OWN') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Permission_action_key` ON `Permission`(`action`);

-- CreateIndex
CREATE UNIQUE INDEX `Permission_action_resource_key` ON `Permission`(`action`, `resource`);
