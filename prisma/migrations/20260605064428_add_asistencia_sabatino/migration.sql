-- CreateTable
CREATE TABLE "AsistenciaSabatino" (
    "id" SERIAL NOT NULL,
    "asistio" BOOLEAN NOT NULL DEFAULT true,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_sabatino" INTEGER NOT NULL,
    "id_miembro" INTEGER NOT NULL,

    CONSTRAINT "AsistenciaSabatino_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AsistenciaSabatino_id_miembro_idx" ON "AsistenciaSabatino"("id_miembro");

-- CreateIndex
CREATE INDEX "AsistenciaSabatino_id_sabatino_borrado_idx" ON "AsistenciaSabatino"("id_sabatino", "borrado");

-- CreateIndex
CREATE UNIQUE INDEX "AsistenciaSabatino_id_sabatino_id_miembro_key" ON "AsistenciaSabatino"("id_sabatino", "id_miembro");

-- AddForeignKey
ALTER TABLE "AsistenciaSabatino" ADD CONSTRAINT "AsistenciaSabatino_id_sabatino_fkey" FOREIGN KEY ("id_sabatino") REFERENCES "Sabatino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsistenciaSabatino" ADD CONSTRAINT "AsistenciaSabatino_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
