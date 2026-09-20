/*
  Warnings:

  - You are about to drop the column `departementId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `departementId` on the `Utilisateur` table. All the data in the column will be lost.
  - You are about to drop the `Departement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Departement" DROP CONSTRAINT "Departement_centreId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_departementId_fkey";

-- DropForeignKey
ALTER TABLE "Utilisateur" DROP CONSTRAINT "Utilisateur_departementId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "departementId";

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "departementId";

-- DropTable
DROP TABLE "Departement";
