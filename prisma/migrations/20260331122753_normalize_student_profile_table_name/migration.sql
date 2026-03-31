/*
  Warnings:

  - You are about to drop the `StudentProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudentProfile" DROP CONSTRAINT "StudentProfile_userId_fkey";

-- DropTable
DROP TABLE "StudentProfile";

-- CreateTable
CREATE TABLE "studentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "lrn" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "yearLevel" INTEGER NOT NULL,
    "proofOfEnrollmentUrl" TEXT NOT NULL,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studentProfile_userId_key" ON "studentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "studentProfile_lrn_key" ON "studentProfile"("lrn");

-- CreateIndex
CREATE UNIQUE INDEX "studentProfile_studentNumber_key" ON "studentProfile"("studentNumber");

-- CreateIndex
CREATE INDEX "studentProfile_userId_idx" ON "studentProfile"("userId");

-- AddForeignKey
ALTER TABLE "studentProfile" ADD CONSTRAINT "studentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
