/*
  Warnings:

  - You are about to drop the column `proofOfImageUrl` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `proofOfEnrollmentUrl` on the `studentProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payment" DROP COLUMN "proofOfImageUrl";

-- AlterTable
ALTER TABLE "studentProfile" DROP COLUMN "proofOfEnrollmentUrl";

-- CreateTable
CREATE TABLE "upload" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentProfileId" TEXT,
    "paymentId" TEXT,

    CONSTRAINT "upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_category_idx" ON "upload"("category");

-- CreateIndex
CREATE INDEX "upload_studentProfileId_idx" ON "upload"("studentProfileId");

-- CreateIndex
CREATE INDEX "upload_paymentId_idx" ON "upload"("paymentId");

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "studentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
