-- CreateTable
CREATE TABLE "public"."EventoVentaCostoItem" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidad_medida" TEXT,
    "costo_unitario_x10000" INTEGER NOT NULL,
    "cantidad_x10000" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_evento_venta" INTEGER NOT NULL,

    CONSTRAINT "EventoVentaCostoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventoVentaCostoItem_id_evento_venta_borrado_idx" ON "public"."EventoVentaCostoItem"("id_evento_venta", "borrado");

-- AddForeignKey
ALTER TABLE "public"."EventoVentaCostoItem" ADD CONSTRAINT "EventoVentaCostoItem_id_evento_venta_fkey" FOREIGN KEY ("id_evento_venta") REFERENCES "public"."EventoVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
