CREATE TABLE "AsignacionAPF" (
  "id" SERIAL NOT NULL,
  "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_fin" TIMESTAMP(3),
  "observacion" TEXT,
  "borrado" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "id_adulto" INTEGER NOT NULL,
  "id_consejo" INTEGER NOT NULL,

  CONSTRAINT "AsignacionAPF_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AsignacionAPF"
ADD CONSTRAINT "AsignacionAPF_id_adulto_fkey"
FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AsignacionAPF"
ADD CONSTRAINT "AsignacionAPF_id_consejo_fkey"
FOREIGN KEY ("id_consejo") REFERENCES "Consejo"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
