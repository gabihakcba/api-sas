-- AlterTable
ALTER TABLE "Consejo"
ADD COLUMN "id_secretario" INTEGER,
ADD COLUMN "id_prosecretario" INTEGER;

-- CreateIndex
CREATE INDEX "Consejo_id_secretario_idx" ON "Consejo"("id_secretario");

-- CreateIndex
CREATE INDEX "Consejo_id_prosecretario_idx" ON "Consejo"("id_prosecretario");

-- AddForeignKey
ALTER TABLE "Consejo"
ADD CONSTRAINT "Consejo_id_secretario_fkey"
FOREIGN KEY ("id_secretario") REFERENCES "Miembro"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consejo"
ADD CONSTRAINT "Consejo_id_prosecretario_fkey"
FOREIGN KEY ("id_prosecretario") REFERENCES "Miembro"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
