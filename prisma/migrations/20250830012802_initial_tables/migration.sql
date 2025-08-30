-- AlterTable
ALTER TABLE `Cuenta` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Miembro` ADD COLUMN `borrado` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Protagonista` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `es_becado` BOOLEAN NOT NULL DEFAULT false,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_miembro` INTEGER NOT NULL,

    UNIQUE INDEX `Protagonista_id_miembro_key`(`id_miembro`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Adulto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `es_becado` BOOLEAN NOT NULL DEFAULT false,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_miembro` INTEGER NOT NULL,

    UNIQUE INDEX `Adulto_id_miembro_key`(`id_miembro`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Responsable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_miembro` INTEGER NOT NULL,
    `id_relacion` INTEGER NOT NULL,

    UNIQUE INDEX `Responsable_id_miembro_key`(`id_miembro`),
    UNIQUE INDEX `Responsable_id_relacion_key`(`id_relacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Relacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Responsabilidad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_protagonista` INTEGER NOT NULL,
    `id_responsable` INTEGER NOT NULL,

    UNIQUE INDEX `Responsabilidad_id_protagonista_key`(`id_protagonista`),
    UNIQUE INDEX `Responsabilidad_id_responsable_key`(`id_responsable`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Area` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_rama` INTEGER NULL,

    UNIQUE INDEX `Area_id_rama_key`(`id_rama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EquipoArea` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_area` INTEGER NOT NULL,
    `id_adulto` INTEGER NOT NULL,
    `id_posicion` INTEGER NOT NULL,

    UNIQUE INDEX `EquipoArea_id_adulto_key`(`id_adulto`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rama` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `edad_minima_protagonistas` INTEGER NOT NULL,
    `edad_maxima_protagonistas` INTEGER NOT NULL,
    `edad_minima_adulto` INTEGER NOT NULL,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PosicionArea` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MiembroRama` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_miembro` INTEGER NOT NULL,
    `id_rama` INTEGER NOT NULL,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MiembroRama_id_miembro_key`(`id_miembro`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NOT NULL,
    `lugar` VARCHAR(191) NULL,
    `terminado` BOOLEAN NOT NULL DEFAULT false,
    `costo_mp` DOUBLE NOT NULL,
    `costo_ma` DOUBLE NOT NULL,
    `costo_ayudante` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_tipo` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoEvento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comision` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_evento` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParticipantesComision` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_fin` DATETIME(3) NULL,
    `borrado` BOOLEAN NOT NULL DEFAULT false,
    `id_comision` INTEGER NOT NULL,
    `id_miembro` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AreaAfectada` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_evento` INTEGER NOT NULL,
    `id_area` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InscripcionEvento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(191) NULL,
    `asistio` BOOLEAN NOT NULL DEFAULT false,
    `pagado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_evento` INTEGER NOT NULL,
    `id_miembro` INTEGER NOT NULL,
    `formacionAdultosId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `monto` DOUBLE NOT NULL,
    `fecha_pago` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_cuenta_dinero` INTEGER NOT NULL,
    `id_metodo_pago` INTEGER NOT NULL,
    `id_tipo_pago` INTEGER NOT NULL,
    `id_evento` INTEGER NULL,
    `id_miembro` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoPago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MetodoPago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CuentaDinero` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `monto_actual` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_area` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanFormacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `nivel` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_area` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormacionAdultos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NULL,
    `id_adulto` INTEGER NOT NULL,
    `id_plan_formacion` INTEGER NOT NULL,
    `id_certificado` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certificado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `id_adulto` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Consejo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `es_ordinario` BOOLEAN NOT NULL DEFAULT true,
    `hora_inicio` DATETIME(3) NULL,
    `hora_fin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AsistenciaConsejo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(191) NOT NULL,
    `id_consejo` INTEGER NOT NULL,
    `id_miembro` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TemarioConsejo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `debate` VARCHAR(191) NULL,
    `acuerdo` VARCHAR(191) NULL,
    `sin_mp` BOOLEAN NOT NULL DEFAULT false,
    `id_consejo` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Protagonista` ADD CONSTRAINT `Protagonista_id_miembro_fkey` FOREIGN KEY (`id_miembro`) REFERENCES `Miembro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Adulto` ADD CONSTRAINT `Adulto_id_miembro_fkey` FOREIGN KEY (`id_miembro`) REFERENCES `Miembro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Responsable` ADD CONSTRAINT `Responsable_id_miembro_fkey` FOREIGN KEY (`id_miembro`) REFERENCES `Miembro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Responsable` ADD CONSTRAINT `Responsable_id_relacion_fkey` FOREIGN KEY (`id_relacion`) REFERENCES `Relacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Responsabilidad` ADD CONSTRAINT `Responsabilidad_id_protagonista_fkey` FOREIGN KEY (`id_protagonista`) REFERENCES `Protagonista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Responsabilidad` ADD CONSTRAINT `Responsabilidad_id_responsable_fkey` FOREIGN KEY (`id_responsable`) REFERENCES `Responsable`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Area` ADD CONSTRAINT `Area_id_rama_fkey` FOREIGN KEY (`id_rama`) REFERENCES `Rama`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EquipoArea` ADD CONSTRAINT `EquipoArea_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `Area`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EquipoArea` ADD CONSTRAINT `EquipoArea_id_adulto_fkey` FOREIGN KEY (`id_adulto`) REFERENCES `Adulto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EquipoArea` ADD CONSTRAINT `EquipoArea_id_posicion_fkey` FOREIGN KEY (`id_posicion`) REFERENCES `PosicionArea`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MiembroRama` ADD CONSTRAINT `MiembroRama_id_miembro_fkey` FOREIGN KEY (`id_miembro`) REFERENCES `Miembro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MiembroRama` ADD CONSTRAINT `MiembroRama_id_rama_fkey` FOREIGN KEY (`id_rama`) REFERENCES `Rama`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_id_tipo_fkey` FOREIGN KEY (`id_tipo`) REFERENCES `TipoEvento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comision` ADD CONSTRAINT `Comision_id_evento_fkey` FOREIGN KEY (`id_evento`) REFERENCES `Evento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParticipantesComision` ADD CONSTRAINT `ParticipantesComision_id_comision_fkey` FOREIGN KEY (`id_comision`) REFERENCES `Comision`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParticipantesComision` ADD CONSTRAINT `ParticipantesComision_id_miembro_fkey` FOREIGN KEY (`id_miembro`) REFERENCES `Miembro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AreaAfectada` ADD CONSTRAINT `AreaAfectada_id_evento_fkey` FOREIGN KEY (`id_evento`) REFERENCES `Evento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AreaAfectada` ADD CONSTRAINT `AreaAfectada_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `Area`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InscripcionEvento` ADD CONSTRAINT `InscripcionEvento_id_evento_fkey` FOREIGN KEY (`id_evento`) REFERENCES `Evento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InscripcionEvento` ADD CONSTRAINT `InscripcionEvento_id_miembro_fkey` FOREIGN KEY (`id_miembro`) REFERENCES `Miembro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_id_cuenta_dinero_fkey` FOREIGN KEY (`id_cuenta_dinero`) REFERENCES `CuentaDinero`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_id_metodo_pago_fkey` FOREIGN KEY (`id_metodo_pago`) REFERENCES `MetodoPago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_id_tipo_pago_fkey` FOREIGN KEY (`id_tipo_pago`) REFERENCES `TipoPago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_id_evento_fkey` FOREIGN KEY (`id_evento`) REFERENCES `Evento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_id_miembro_fkey` FOREIGN KEY (`id_miembro`) REFERENCES `Miembro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuentaDinero` ADD CONSTRAINT `CuentaDinero_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `Area`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanFormacion` ADD CONSTRAINT `PlanFormacion_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `Area`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormacionAdultos` ADD CONSTRAINT `FormacionAdultos_id_adulto_fkey` FOREIGN KEY (`id_adulto`) REFERENCES `Adulto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormacionAdultos` ADD CONSTRAINT `FormacionAdultos_id_plan_formacion_fkey` FOREIGN KEY (`id_plan_formacion`) REFERENCES `PlanFormacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormacionAdultos` ADD CONSTRAINT `FormacionAdultos_id_certificado_fkey` FOREIGN KEY (`id_certificado`) REFERENCES `Certificado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificado` ADD CONSTRAINT `Certificado_id_adulto_fkey` FOREIGN KEY (`id_adulto`) REFERENCES `Adulto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AsistenciaConsejo` ADD CONSTRAINT `AsistenciaConsejo_id_consejo_fkey` FOREIGN KEY (`id_consejo`) REFERENCES `Consejo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AsistenciaConsejo` ADD CONSTRAINT `AsistenciaConsejo_id_miembro_fkey` FOREIGN KEY (`id_miembro`) REFERENCES `Miembro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemarioConsejo` ADD CONSTRAINT `TemarioConsejo_id_consejo_fkey` FOREIGN KEY (`id_consejo`) REFERENCES `Consejo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
