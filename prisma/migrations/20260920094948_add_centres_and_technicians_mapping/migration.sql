-- AlterEnum
ALTER TYPE "Priorite" ADD VALUE 'URGENTE';

-- AlterTable
ALTER TABLE "Departement" ADD COLUMN     "centreId" INTEGER;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "centreId" INTEGER;

-- CreateTable
CREATE TABLE "Centre" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "technicienId" INTEGER,

    CONSTRAINT "Centre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Centre_nom_key" ON "Centre"("nom");

-- AddForeignKey
ALTER TABLE "Centre" ADD CONSTRAINT "Centre_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departement" ADD CONSTRAINT "Departement_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE SET NULL ON UPDATE CASCADE;
