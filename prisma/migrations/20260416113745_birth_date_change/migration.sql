/*
  Warnings:

  - You are about to drop the column `birthdate` on the `studentProfile` table. All the data in the column will be lost.
  - Added the required column `birthDate` to the `studentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "studentProfile" DROP COLUMN "birthdate",
ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL;
