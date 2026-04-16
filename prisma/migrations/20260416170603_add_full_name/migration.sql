/*
  Warnings:

  - Added the required column `fullName` to the `studentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "studentProfile" ADD COLUMN     "fullName" TEXT NOT NULL;
