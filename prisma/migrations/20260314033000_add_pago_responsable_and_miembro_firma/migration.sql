ALTER TABLE "Miembro"
ADD COLUMN "firma" BYTEA;

ALTER TABLE "Pago"
ADD COLUMN "id_responsable" INTEGER;

ALTER TABLE "Pago"
ADD CONSTRAINT "Pago_id_responsable_fkey"
FOREIGN KEY ("id_responsable") REFERENCES "Miembro"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Pago_id_responsable_idx" ON "Pago"("id_responsable");
