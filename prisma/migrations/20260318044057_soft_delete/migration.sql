/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `PlanFormacionTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlanFormacionTemplate_nombre_key" ON "PlanFormacionTemplate"("nombre");

-- RenameIndex
ALTER INDEX "AdjuntoFormacionTemplate_id_plan_formacion_template_archivo_n_k" RENAME TO "AdjuntoFormacionTemplate_id_plan_formacion_template_archivo_key";
