-- CreateEnum
CREATE TYPE "ACTION" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE');

-- CreateEnum
CREATE TYPE "RESOURCE" AS ENUM ('CUENTA', 'MIEMBRO', 'PROTAGONISTA', 'ADULTO', 'RESPONSABLE', 'AREA', 'RAMA', 'EVENTO', 'INSCRIPCION', 'PAGO', 'PRESUPUESTO', 'INVENTARIO', 'PLAN_FORMACION', 'ASISTENCIA', 'CERTIFICADO', 'CUENTA_DINERO', 'LIBRO_ACTAS', 'LOG', 'ACTION');

-- CreateEnum
CREATE TYPE "SCOPE" AS ENUM ('GRUPO', 'RAMA', 'GLOBAL', 'OWN');

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" SERIAL NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Miembro" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,
    "direccion" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "telefono_emergencia" TEXT NOT NULL,
    "totem" TEXT,
    "cualidad" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_cuenta" INTEGER NOT NULL,

    CONSTRAINT "Miembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protagonista" (
    "id" SERIAL NOT NULL,
    "es_becado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_miembro" INTEGER NOT NULL,

    CONSTRAINT "Protagonista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adulto" (
    "id" SERIAL NOT NULL,
    "es_becado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_miembro" INTEGER NOT NULL,

    CONSTRAINT "Adulto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsable" (
    "id" SERIAL NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_miembro" INTEGER NOT NULL,
    "id_relacion" INTEGER NOT NULL,

    CONSTRAINT "Responsable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relacion" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Relacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsabilidad" (
    "id" SERIAL NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_protagonista" INTEGER NOT NULL,
    "id_responsable" INTEGER NOT NULL,

    CONSTRAINT "Responsabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipoArea" (
    "id" SERIAL NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_area" INTEGER NOT NULL,
    "id_adulto" INTEGER NOT NULL,
    "id_posicion" INTEGER NOT NULL,
    "id_rama" INTEGER,

    CONSTRAINT "EquipoArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rama" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "edad_minima_protagonistas" INTEGER NOT NULL,
    "edad_maxima_protagonistas" INTEGER NOT NULL,
    "edad_minima_adulto" INTEGER NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_area" INTEGER NOT NULL,

    CONSTRAINT "Rama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosicionArea" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "PosicionArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiembroRama" (
    "id" SERIAL NOT NULL,
    "id_miembro" INTEGER NOT NULL,
    "id_rama" INTEGER NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiembroRama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "terminado" BOOLEAN NOT NULL DEFAULT false,
    "costo_mp" DOUBLE PRECISION NOT NULL,
    "costo_ma" DOUBLE PRECISION NOT NULL,
    "costo_ayudante" DOUBLE PRECISION NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_tipo" INTEGER NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoEvento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "TipoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comision" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_evento" INTEGER,

    CONSTRAINT "Comision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantesComision" (
    "id" SERIAL NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_comision" INTEGER NOT NULL,
    "id_miembro" INTEGER NOT NULL,

    CONSTRAINT "ParticipantesComision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaAfectada" (
    "id" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_area" INTEGER NOT NULL,

    CONSTRAINT "AreaAfectada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscripcionEvento" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT,
    "asistio" BOOLEAN NOT NULL DEFAULT false,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_miembro" INTEGER NOT NULL,
    "formacionAdultosId" INTEGER,

    CONSTRAINT "InscripcionEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_cuenta_dinero" INTEGER NOT NULL,
    "id_metodo_pago" INTEGER NOT NULL,
    "id_tipo_pago" INTEGER NOT NULL,
    "id_evento" INTEGER,
    "id_miembro" INTEGER NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptoPago" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetodoPago" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaDinero" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto_actual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_area" INTEGER NOT NULL,

    CONSTRAINT "CuentaDinero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFormacion" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "nivel" INTEGER,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_area" INTEGER NOT NULL,

    CONSTRAINT "PlanFormacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormacionAdultos" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_adulto" INTEGER NOT NULL,
    "id_plan_formacion" INTEGER NOT NULL,
    "id_certificado" INTEGER NOT NULL,

    CONSTRAINT "FormacionAdultos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "url" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_adulto" INTEGER NOT NULL,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consejo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_ordinario" BOOLEAN NOT NULL DEFAULT true,
    "hora_inicio" TIMESTAMP(3),
    "hora_fin" TIMESTAMP(3),
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consejo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsistenciaConsejo" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_consejo" INTEGER NOT NULL,
    "id_miembro" INTEGER NOT NULL,

    CONSTRAINT "AsistenciaConsejo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemarioConsejo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "debate" TEXT,
    "acuerdo" TEXT,
    "sin_mp" BOOLEAN NOT NULL DEFAULT false,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_consejo" INTEGER NOT NULL,

    CONSTRAINT "TemarioConsejo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "cuenta" JSONB NOT NULL,
    "miembro" JSONB NOT NULL,
    "endpoint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" SERIAL NOT NULL,
    "tabla" TEXT NOT NULL,
    "pre_registro" JSONB NOT NULL,
    "post_resgistro" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_log" INTEGER NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "action" "ACTION" NOT NULL,
    "resource" "RESOURCE" NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id_role" INTEGER NOT NULL,
    "id_permission" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id_role","id_permission")
);

-- CreateTable
CREATE TABLE "CuentaRole" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_scope" "SCOPE" NOT NULL DEFAULT 'GLOBAL',
    "id_scope" INTEGER,
    "id_cuenta" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL,

    CONSTRAINT "CuentaRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_user_key" ON "Cuenta"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Miembro_dni_key" ON "Miembro"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Miembro_email_key" ON "Miembro"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Miembro_id_cuenta_key" ON "Miembro"("id_cuenta");

-- CreateIndex
CREATE UNIQUE INDEX "Protagonista_id_miembro_key" ON "Protagonista"("id_miembro");

-- CreateIndex
CREATE UNIQUE INDEX "Adulto_id_miembro_key" ON "Adulto"("id_miembro");

-- CreateIndex
CREATE UNIQUE INDEX "Responsable_id_miembro_key" ON "Responsable"("id_miembro");

-- CreateIndex
CREATE UNIQUE INDEX "Responsable_id_relacion_key" ON "Responsable"("id_relacion");

-- CreateIndex
CREATE UNIQUE INDEX "Responsabilidad_id_protagonista_key" ON "Responsabilidad"("id_protagonista");

-- CreateIndex
CREATE UNIQUE INDEX "Responsabilidad_id_responsable_key" ON "Responsabilidad"("id_responsable");

-- CreateIndex
CREATE UNIQUE INDEX "Area_nombre_key" ON "Area"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoArea_id_adulto_key" ON "EquipoArea"("id_adulto");

-- CreateIndex
CREATE UNIQUE INDEX "Rama_nombre_key" ON "Rama"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "PosicionArea_nombre_key" ON "PosicionArea"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MiembroRama_id_miembro_key" ON "MiembroRama"("id_miembro");

-- CreateIndex
CREATE UNIQUE INDEX "Role_nombre_key" ON "Role"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_resource_key" ON "Permission"("action", "resource");

-- AddForeignKey
ALTER TABLE "Miembro" ADD CONSTRAINT "Miembro_id_cuenta_fkey" FOREIGN KEY ("id_cuenta") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protagonista" ADD CONSTRAINT "Protagonista_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adulto" ADD CONSTRAINT "Adulto_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsable" ADD CONSTRAINT "Responsable_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsable" ADD CONSTRAINT "Responsable_id_relacion_fkey" FOREIGN KEY ("id_relacion") REFERENCES "Relacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsabilidad" ADD CONSTRAINT "Responsabilidad_id_protagonista_fkey" FOREIGN KEY ("id_protagonista") REFERENCES "Protagonista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsabilidad" ADD CONSTRAINT "Responsabilidad_id_responsable_fkey" FOREIGN KEY ("id_responsable") REFERENCES "Responsable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoArea" ADD CONSTRAINT "EquipoArea_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoArea" ADD CONSTRAINT "EquipoArea_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoArea" ADD CONSTRAINT "EquipoArea_id_posicion_fkey" FOREIGN KEY ("id_posicion") REFERENCES "PosicionArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoArea" ADD CONSTRAINT "EquipoArea_id_rama_fkey" FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rama" ADD CONSTRAINT "Rama_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroRama" ADD CONSTRAINT "MiembroRama_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroRama" ADD CONSTRAINT "MiembroRama_id_rama_fkey" FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantesComision" ADD CONSTRAINT "ParticipantesComision_id_comision_fkey" FOREIGN KEY ("id_comision") REFERENCES "Comision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantesComision" ADD CONSTRAINT "ParticipantesComision_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaAfectada" ADD CONSTRAINT "AreaAfectada_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaAfectada" ADD CONSTRAINT "AreaAfectada_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionEvento" ADD CONSTRAINT "InscripcionEvento_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionEvento" ADD CONSTRAINT "InscripcionEvento_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_id_cuenta_dinero_fkey" FOREIGN KEY ("id_cuenta_dinero") REFERENCES "CuentaDinero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_id_metodo_pago_fkey" FOREIGN KEY ("id_metodo_pago") REFERENCES "MetodoPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_id_tipo_pago_fkey" FOREIGN KEY ("id_tipo_pago") REFERENCES "ConceptoPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaDinero" ADD CONSTRAINT "CuentaDinero_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFormacion" ADD CONSTRAINT "PlanFormacion_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormacionAdultos" ADD CONSTRAINT "FormacionAdultos_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormacionAdultos" ADD CONSTRAINT "FormacionAdultos_id_plan_formacion_fkey" FOREIGN KEY ("id_plan_formacion") REFERENCES "PlanFormacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormacionAdultos" ADD CONSTRAINT "FormacionAdultos_id_certificado_fkey" FOREIGN KEY ("id_certificado") REFERENCES "Certificado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_id_adulto_fkey" FOREIGN KEY ("id_adulto") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsistenciaConsejo" ADD CONSTRAINT "AsistenciaConsejo_id_consejo_fkey" FOREIGN KEY ("id_consejo") REFERENCES "Consejo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsistenciaConsejo" ADD CONSTRAINT "AsistenciaConsejo_id_miembro_fkey" FOREIGN KEY ("id_miembro") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemarioConsejo" ADD CONSTRAINT "TemarioConsejo_id_consejo_fkey" FOREIGN KEY ("id_consejo") REFERENCES "Consejo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_id_log_fkey" FOREIGN KEY ("id_log") REFERENCES "Log"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_id_permission_fkey" FOREIGN KEY ("id_permission") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaRole" ADD CONSTRAINT "CuentaRole_id_cuenta_fkey" FOREIGN KEY ("id_cuenta") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaRole" ADD CONSTRAINT "CuentaRole_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
