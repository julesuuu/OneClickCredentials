/*
  Warnings:

  - You are about to drop the column `userId` on the `appointment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `payment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "appointment" DROP CONSTRAINT "appointment_userId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_userId_fkey";

-- DropIndex
DROP INDEX "appointment_userId_idx";

-- DropIndex
DROP INDEX "payment_userId_idx";

-- AlterTable
ALTER TABLE "appointment" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "payment" DROP COLUMN "userId";
