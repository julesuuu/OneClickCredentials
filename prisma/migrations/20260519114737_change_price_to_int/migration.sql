/*
  Warnings:

  - You are about to alter the column `totalPrice` on the `documentRequest` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `price` on the `documentType` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `amount` on the `payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "documentRequest" ALTER COLUMN "totalPrice" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "documentType" ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "payment" ALTER COLUMN "amount" SET DATA TYPE INTEGER;
