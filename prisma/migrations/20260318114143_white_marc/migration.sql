-- CreateTable
CREATE TABLE "ConfiguracionGrupo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombre_grupo" TEXT NOT NULL DEFAULT 'Grupo Scout',
    "url_logo" TEXT,
    "url_favicon" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'lara-light-blue',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionGrupo_pkey" PRIMARY KEY ("id")
);
