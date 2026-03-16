-- AlterTable
ALTER TABLE "Consejo"
ADD COLUMN "id_moderador" INTEGER;

-- CreateIndex
CREATE INDEX "Consejo_id_moderador_idx" ON "Consejo"("id_moderador");

-- AddForeignKey
ALTER TABLE "Consejo"
ADD CONSTRAINT "Consejo_id_moderador_fkey"
FOREIGN KEY ("id_moderador") REFERENCES "Miembro"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
