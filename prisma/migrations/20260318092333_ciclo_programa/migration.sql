-- CreateEnum
CREATE TYPE "ESTADO_CICLO" AS ENUM ('DIAGNOSTICO', 'PLANIFICACION', 'DESARROLLO', 'EVALUACION', 'FINALIZADO');

-- AlterEnum
ALTER TYPE "RESOURCE" ADD VALUE 'CICLO_PROGRAMA';

-- AlterTable
ALTER TABLE "Evento" ADD COLUMN     "id_ciclo_programa" INTEGER;

-- CreateTable
CREATE TABLE "CicloPrograma" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estado" "ESTADO_CICLO" NOT NULL DEFAULT 'DIAGNOSTICO',
    "diagnostico" TEXT,
    "planificacion" TEXT,
    "desarrollo" TEXT,
    "evaluacion" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_rama" INTEGER NOT NULL,

    CONSTRAINT "CicloPrograma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CicloPrograma_id_rama_borrado_idx" ON "CicloPrograma"("id_rama", "borrado");

-- CreateIndex
CREATE INDEX "CicloPrograma_id_rama_estado_borrado_idx" ON "CicloPrograma"("id_rama", "estado", "borrado");

-- CreateIndex
CREATE INDEX "CicloPrograma_fecha_inicio_fecha_fin_idx" ON "CicloPrograma"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "Evento_id_ciclo_programa_idx" ON "Evento"("id_ciclo_programa");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_id_ciclo_programa_fkey" FOREIGN KEY ("id_ciclo_programa") REFERENCES "CicloPrograma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CicloPrograma" ADD CONSTRAINT "CicloPrograma_id_rama_fkey" FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
