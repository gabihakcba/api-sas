-- AlterTable
ALTER TABLE "Log"
ADD COLUMN "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "ip" TEXT,
ADD COLUMN "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Action"
RENAME COLUMN "post_resgistro" TO "post_registro";
