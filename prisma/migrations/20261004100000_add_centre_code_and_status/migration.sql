-- AlterTable
ALTER TABLE "Centre" ADD COLUMN     "codeBureau" TEXT,
ADD COLUMN     "statutActif" BOOLEAN NOT NULL DEFAULT true;
