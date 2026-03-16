-- CreateTable
CREATE TABLE "AdjuntoFormacionTemplate" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "archivo" BYTEA,
    "archivo_mime" TEXT,
    "archivo_nombre" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_plan_formacion_template" INTEGER NOT NULL,

    CONSTRAINT "AdjuntoFormacionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdjuntoFormacionTemplate_id_plan_formacion_template_archivo_n_key" ON "AdjuntoFormacionTemplate"("id_plan_formacion_template", "archivo_nombre");

-- AddForeignKey
ALTER TABLE "AdjuntoFormacionTemplate" ADD CONSTRAINT "AdjuntoFormacionTemplate_id_plan_formacion_template_fkey" FOREIGN KEY ("id_plan_formacion_template") REFERENCES "PlanFormacionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
