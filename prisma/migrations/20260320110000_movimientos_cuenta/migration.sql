-- CreateEnum
CREATE TYPE "TIPO_MOVIMIENTO_CUENTA" AS ENUM ('INGRESO', 'EGRESO');

-- CreateTable
CREATE TABLE "MovimientoCuenta" (
    "id" SERIAL NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "tipo" "TIPO_MOVIMIENTO_CUENTA" NOT NULL,
    "detalles" TEXT,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saldo_anterior" DECIMAL(15,2) NOT NULL,
    "saldo_posterior" DECIMAL(15,2) NOT NULL,
    "codigo_referencia" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_cuenta_dinero" INTEGER NOT NULL,
    "id_responsable" INTEGER NOT NULL,
    "id_metodo_pago" INTEGER NOT NULL,

    CONSTRAINT "MovimientoCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCuentaAdjunto" (
    "id" SERIAL NOT NULL,
    "archivo" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_movimiento_cuenta" INTEGER NOT NULL,

    CONSTRAINT "MovimientoCuentaAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoCuenta_codigo_referencia_key" ON "MovimientoCuenta"("codigo_referencia");

-- AddForeignKey
ALTER TABLE "MovimientoCuenta" ADD CONSTRAINT "MovimientoCuenta_id_cuenta_dinero_fkey" FOREIGN KEY ("id_cuenta_dinero") REFERENCES "CuentaDinero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuenta" ADD CONSTRAINT "MovimientoCuenta_id_responsable_fkey" FOREIGN KEY ("id_responsable") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuenta" ADD CONSTRAINT "MovimientoCuenta_id_metodo_pago_fkey" FOREIGN KEY ("id_metodo_pago") REFERENCES "MetodoPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuentaAdjunto" ADD CONSTRAINT "MovimientoCuentaAdjunto_id_movimiento_cuenta_fkey" FOREIGN KEY ("id_movimiento_cuenta") REFERENCES "MovimientoCuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
