-- AlterTable
ALTER TABLE "Sabatino"
ADD COLUMN "id_evento" INTEGER;

-- CreateIndex
CREATE INDEX "Sabatino_id_evento_borrado_idx" ON "Sabatino"("id_evento", "borrado");

-- AddForeignKey
ALTER TABLE "Sabatino" ADD CONSTRAINT "Sabatino_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
