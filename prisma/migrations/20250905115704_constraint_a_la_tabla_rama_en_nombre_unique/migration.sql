/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Rama` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Rama_nombre_key` ON `Rama`(`nombre`);
