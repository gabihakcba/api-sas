-- DropForeignKey
ALTER TABLE "ActividadEducadorSabatino" DROP CONSTRAINT "ActividadEducadorSabatino_id_adulto_fkey";

-- DropForeignKey
ALTER TABLE "ActividadEducadorSabatino" DROP CONSTRAINT "ActividadEducadorSabatino_id_sabatino_fkey";

-- DropForeignKey
ALTER TABLE "ActividadSabatino" DROP CONSTRAINT "ActividadSabatino_id_actividad_fkey";

-- DropForeignKey
ALTER TABLE "ActividadSabatino" DROP CONSTRAINT "ActividadSabatino_id_sabatino_fkey";

-- DropForeignKey
ALTER TABLE "ActividadSabatinoResponsable" DROP CONSTRAINT "ActividadSabatinoResponsable_id_actividad_id_sabatino_fkey";

-- DropForeignKey
ALTER TABLE "ActividadSabatinoResponsable" DROP CONSTRAINT "ActividadSabatinoResponsable_id_adulto_fkey";

-- DropForeignKey
ALTER TABLE "AreaAfectadaSabatino" DROP CONSTRAINT "AreaAfectadaSabatino_id_area_fkey";

-- DropForeignKey
ALTER TABLE "AreaAfectadaSabatino" DROP CONSTRAINT "AreaAfectadaSabatino_id_sabatino_fkey";

-- DropForeignKey
ALTER TABLE "RamaAfectadaSabatino" DROP CONSTRAINT "RamaAfectadaSabatino_id_rama_fkey";

-- DropForeignKey
ALTER TABLE "RamaAfectadaSabatino" DROP CONSTRAINT "RamaAfectadaSabatino_id_sabatino_fkey";

-- AddForeignKey
ALTER TABLE "ActividadEducadorSabatino" ADD CONSTRAINT "ActividadEducadorSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadEducadorSabatino" ADD CONSTRAINT "ActividadEducadorSabatino_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadSabatino" ADD CONSTRAINT "ActividadSabatino_id_actividad_fkey" FOREIGN KEY ("id_actividad") REFERENCES "Actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadSabatino" ADD CONSTRAINT "ActividadSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadSabatinoResponsable" ADD CONSTRAINT "ActividadSabatinoResponsable_id_actividad_id_sabatino_fkey" FOREIGN KEY ("id_actividad", "id_sabatino") REFERENCES "ActividadSabatino"("id_actividad", "id_sabatino") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadSabatinoResponsable" ADD CONSTRAINT "ActividadSabatinoResponsable_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RamaAfectadaSabatino" ADD CONSTRAINT "RamaAfectadaSabatino_id_rama_fkey" FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RamaAfectadaSabatino" ADD CONSTRAINT "RamaAfectadaSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaAfectadaSabatino" ADD CONSTRAINT "AreaAfectadaSabatino_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaAfectadaSabatino" ADD CONSTRAINT "AreaAfectadaSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
