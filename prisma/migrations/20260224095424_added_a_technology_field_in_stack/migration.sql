/*
  Warnings:

  - Added the required column `technology` to the `Stack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stack" ADD COLUMN     "technology" TEXT NOT NULL;
