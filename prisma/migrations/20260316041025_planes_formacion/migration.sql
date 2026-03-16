/*
  Warnings:

  - You are about to drop the `Certificado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormacionAdultos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanFormacion` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TIPO_COMPETENCIA_FORMACION" AS ENUM ('ESENCIAL', 'ESPECIFICA');

-- CreateEnum
CREATE TYPE "ESTADO_PLAN_DESEMPENO" AS ENUM ('BORRADOR', 'EN_CURSO', 'FINALIZADO', 'APROBADO');

-- DropForeignKey
ALTER TABLE "Certificado" DROP CONSTRAINT "Certificado_id_adulto_fkey";

-- DropForeignKey
ALTER TABLE "FormacionAdultos" DROP CONSTRAINT "FormacionAdultos_id_adulto_fkey";

-- DropForeignKey
ALTER TABLE "FormacionAdultos" DROP CONSTRAINT "FormacionAdultos_id_certificado_fkey";

-- DropForeignKey
ALTER TABLE "FormacionAdultos" DROP CONSTRAINT "FormacionAdultos_id_plan_formacion_fkey";

-- DropForeignKey
ALTER TABLE "PlanFormacion" DROP CONSTRAINT "PlanFormacion_id_area_fkey";

-- DropTable
DROP TABLE "Certificado";

-- DropTable
DROP TABLE "FormacionAdultos";

-- DropTable
DROP TABLE "PlanFormacion";

-- CreateTable
CREATE TABLE "PlanFormacionTemplate" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_area" INTEGER NOT NULL,

    CONSTRAINT "PlanFormacionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFormacionNivelTemplate" (
    "id" SERIAL NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_plan_formacion_template" INTEGER NOT NULL,

    CONSTRAINT "PlanFormacionNivelTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFormacionCompetenciaTemplate" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TIPO_COMPETENCIA_FORMACION" NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_nivel_template" INTEGER NOT NULL,

    CONSTRAINT "PlanFormacionCompetenciaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFormacionComportamientoTemplate" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_competencia_template" INTEGER NOT NULL,

    CONSTRAINT "PlanFormacionComportamientoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFormacionAprendizajeTemplate" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_competencia_template" INTEGER NOT NULL,

    CONSTRAINT "PlanFormacionAprendizajeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFormacionResultadoTemplate" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_competencia_template" INTEGER NOT NULL,

    CONSTRAINT "PlanFormacionResultadoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanDesempenoAdulto" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" "ESTADO_PLAN_DESEMPENO" NOT NULL DEFAULT 'BORRADOR',
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    "observaciones_generales" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_adulto" INTEGER NOT NULL,
    "id_plan_formacion_template" INTEGER NOT NULL,
    "id_apf_adulto" INTEGER NOT NULL,

    CONSTRAINT "PlanDesempenoAdulto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanDesempenoCompetencia" (
    "id" SERIAL NOT NULL,
    "validada" BOOLEAN NOT NULL DEFAULT false,
    "observacion_apf" TEXT,
    "fecha_validacion" TIMESTAMP(3),
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_plan_desempeno" INTEGER NOT NULL,
    "id_competencia_template" INTEGER NOT NULL,
    "id_apf_validador" INTEGER,

    CONSTRAINT "PlanDesempenoCompetencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanDesempenoCertificado" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "archivo" BYTEA,
    "archivo_mime" TEXT,
    "archivo_nombre" TEXT,
    "fecha_emision" TIMESTAMP(3),
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_plan_desempeno" INTEGER NOT NULL,
    "id_competencia_template" INTEGER,
    "id_nivel_template" INTEGER,

    CONSTRAINT "PlanDesempenoCertificado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanFormacionNivelTemplate_id_plan_formacion_template_orden_key" ON "PlanFormacionNivelTemplate"("id_plan_formacion_template", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFormacionComportamientoTemplate_id_competencia_template_key" ON "PlanFormacionComportamientoTemplate"("id_competencia_template", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFormacionAprendizajeTemplate_id_competencia_template_or_key" ON "PlanFormacionAprendizajeTemplate"("id_competencia_template", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFormacionResultadoTemplate_id_competencia_template_orde_key" ON "PlanFormacionResultadoTemplate"("id_competencia_template", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "PlanDesempenoAdulto_id_adulto_anio_id_plan_formacion_templa_key" ON "PlanDesempenoAdulto"("id_adulto", "anio", "id_plan_formacion_template");

-- CreateIndex
CREATE UNIQUE INDEX "PlanDesempenoCompetencia_id_plan_desempeno_id_competencia_t_key" ON "PlanDesempenoCompetencia"("id_plan_desempeno", "id_competencia_template");

-- AddForeignKey
ALTER TABLE "PlanFormacionTemplate" ADD CONSTRAINT "PlanFormacionTemplate_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFormacionNivelTemplate" ADD CONSTRAINT "PlanFormacionNivelTemplate_id_plan_formacion_template_fkey" FOREIGN KEY ("id_plan_formacion_template") REFERENCES "PlanFormacionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFormacionCompetenciaTemplate" ADD CONSTRAINT "PlanFormacionCompetenciaTemplate_id_nivel_template_fkey" FOREIGN KEY ("id_nivel_template") REFERENCES "PlanFormacionNivelTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFormacionComportamientoTemplate" ADD CONSTRAINT "PlanFormacionComportamientoTemplate_id_competencia_templat_fkey" FOREIGN KEY ("id_competencia_template") REFERENCES "PlanFormacionCompetenciaTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFormacionAprendizajeTemplate" ADD CONSTRAINT "PlanFormacionAprendizajeTemplate_id_competencia_template_fkey" FOREIGN KEY ("id_competencia_template") REFERENCES "PlanFormacionCompetenciaTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFormacionResultadoTemplate" ADD CONSTRAINT "PlanFormacionResultadoTemplate_id_competencia_template_fkey" FOREIGN KEY ("id_competencia_template") REFERENCES "PlanFormacionCompetenciaTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoAdulto" ADD CONSTRAINT "PlanDesempenoAdulto_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoAdulto" ADD CONSTRAINT "PlanDesempenoAdulto_id_plan_formacion_template_fkey" FOREIGN KEY ("id_plan_formacion_template") REFERENCES "PlanFormacionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoAdulto" ADD CONSTRAINT "PlanDesempenoAdulto_id_apf_adulto_fkey" FOREIGN KEY ("id_apf_adulto") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoCompetencia" ADD CONSTRAINT "PlanDesempenoCompetencia_id_plan_desempeno_fkey" FOREIGN KEY ("id_plan_desempeno") REFERENCES "PlanDesempenoAdulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoCompetencia" ADD CONSTRAINT "PlanDesempenoCompetencia_id_competencia_template_fkey" FOREIGN KEY ("id_competencia_template") REFERENCES "PlanFormacionCompetenciaTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoCompetencia" ADD CONSTRAINT "PlanDesempenoCompetencia_id_apf_validador_fkey" FOREIGN KEY ("id_apf_validador") REFERENCES "Adulto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoCertificado" ADD CONSTRAINT "PlanDesempenoCertificado_id_plan_desempeno_fkey" FOREIGN KEY ("id_plan_desempeno") REFERENCES "PlanDesempenoAdulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoCertificado" ADD CONSTRAINT "PlanDesempenoCertificado_id_competencia_template_fkey" FOREIGN KEY ("id_competencia_template") REFERENCES "PlanFormacionCompetenciaTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDesempenoCertificado" ADD CONSTRAINT "PlanDesempenoCertificado_id_nivel_template_fkey" FOREIGN KEY ("id_nivel_template") REFERENCES "PlanFormacionNivelTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
