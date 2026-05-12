-- CreateEnum
CREATE TYPE "TIPO_EVENTO_VENTA_HOJA" AS ENUM ('BALANCE', 'GENERAL', 'SECTOR', 'OTRA');

-- CreateEnum
CREATE TYPE "TIPO_EVENTO_VENTA_SECTOR" AS ENUM ('RAMA', 'AREA', 'EXTRAS', 'OTRO');

-- CreateEnum
CREATE TYPE "TIPO_EVENTO_VENTA_PAGO" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'OTRO');

-- CreateTable
CREATE TABLE "EventoVenta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_evento" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoVentaItem" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio_unitario" DECIMAL(15,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_evento_venta" INTEGER NOT NULL,

    CONSTRAINT "EventoVentaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoVentaItemOferta" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_total" DECIMAL(15,2) NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_evento_venta_item" INTEGER NOT NULL,

    CONSTRAINT "EventoVentaItemOferta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoVentaSector" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_sector" "TIPO_EVENTO_VENTA_SECTOR" NOT NULL DEFAULT 'OTRO',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "nombre_hoja" TEXT,
    "resumen_total_vendido" INTEGER,
    "resumen_total_retirado" INTEGER,
    "monto_rendido_efectivo" DECIMAL(15,2),
    "monto_rendido_transferencia" DECIMAL(15,2),
    "monto_deuda_informado" DECIMAL(15,2),
    "notas" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_evento_venta" INTEGER NOT NULL,
    "id_rama" INTEGER,
    "id_area" INTEGER,

    CONSTRAINT "EventoVentaSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoVentaReserva" (
    "id" SERIAL NOT NULL,
    "comprador_nombre" TEXT NOT NULL,
    "vendedor_nombre" TEXT,
    "cantidad_total" INTEGER NOT NULL DEFAULT 0,
    "cantidad_retirada" INTEGER NOT NULL DEFAULT 0,
    "monto_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "monto_pagado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cuenta_destino" TEXT,
    "observaciones" TEXT,
    "fila_origen" INTEGER,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_evento_venta" INTEGER NOT NULL,
    "id_evento_venta_sector" INTEGER,
    "id_vendedor_miembro" INTEGER,

    CONSTRAINT "EventoVentaReserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoVentaReservaItem" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "id_item" INTEGER NOT NULL,

    CONSTRAINT "EventoVentaReservaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoVentaPago" (
    "id" SERIAL NOT NULL,
    "tipo_pago" "TIPO_EVENTO_VENTA_PAGO" NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "cuenta_destino" TEXT,
    "observaciones" TEXT,
    "fila_origen" INTEGER,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_reserva" INTEGER NOT NULL,

    CONSTRAINT "EventoVentaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoVentaHojaImportada" (
    "id" SERIAL NOT NULL,
    "nombre_hoja" TEXT NOT NULL,
    "nombre_visible" TEXT NOT NULL,
    "tipo_hoja" "TIPO_EVENTO_VENTA_HOJA" NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "contenido" JSONB NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_evento_venta" INTEGER NOT NULL,

    CONSTRAINT "EventoVentaHojaImportada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventoVentaItem_id_evento_venta_borrado_idx" ON "EventoVentaItem"("id_evento_venta", "borrado");
CREATE INDEX "EventoVentaSector_id_evento_venta_borrado_idx" ON "EventoVentaSector"("id_evento_venta", "borrado");
CREATE INDEX "EventoVentaReserva_id_evento_venta_borrado_idx" ON "EventoVentaReserva"("id_evento_venta", "borrado");
CREATE INDEX "EventoVentaReserva_id_evento_venta_sector_borrado_idx" ON "EventoVentaReserva"("id_evento_venta_sector", "borrado");
CREATE INDEX "EventoVentaPago_id_reserva_borrado_idx" ON "EventoVentaPago"("id_reserva", "borrado");
CREATE INDEX "EventoVentaHojaImportada_id_evento_venta_borrado_idx" ON "EventoVentaHojaImportada"("id_evento_venta", "borrado");

-- AddForeignKey
ALTER TABLE "EventoVentaItem" ADD CONSTRAINT "EventoVentaItem_id_evento_venta_fkey" FOREIGN KEY ("id_evento_venta") REFERENCES "EventoVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventoVentaItemOferta" ADD CONSTRAINT "EventoVentaItemOferta_id_evento_venta_item_fkey" FOREIGN KEY ("id_evento_venta_item") REFERENCES "EventoVentaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventoVentaSector" ADD CONSTRAINT "EventoVentaSector_id_evento_venta_fkey" FOREIGN KEY ("id_evento_venta") REFERENCES "EventoVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventoVentaSector" ADD CONSTRAINT "EventoVentaSector_id_rama_fkey" FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventoVentaSector" ADD CONSTRAINT "EventoVentaSector_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventoVentaReserva" ADD CONSTRAINT "EventoVentaReserva_id_evento_venta_fkey" FOREIGN KEY ("id_evento_venta") REFERENCES "EventoVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventoVentaReserva" ADD CONSTRAINT "EventoVentaReserva_id_evento_venta_sector_fkey" FOREIGN KEY ("id_evento_venta_sector") REFERENCES "EventoVentaSector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventoVentaReserva" ADD CONSTRAINT "EventoVentaReserva_id_vendedor_miembro_fkey" FOREIGN KEY ("id_vendedor_miembro") REFERENCES "Miembro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventoVentaReservaItem" ADD CONSTRAINT "EventoVentaReservaItem_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "EventoVentaReserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventoVentaReservaItem" ADD CONSTRAINT "EventoVentaReservaItem_id_item_fkey" FOREIGN KEY ("id_item") REFERENCES "EventoVentaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventoVentaPago" ADD CONSTRAINT "EventoVentaPago_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "EventoVentaReserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventoVentaHojaImportada" ADD CONSTRAINT "EventoVentaHojaImportada_id_evento_venta_fkey" FOREIGN KEY ("id_evento_venta") REFERENCES "EventoVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
