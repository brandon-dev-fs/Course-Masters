/*
  Warnings:

  - Made the column `description` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Lesson` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `description` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN;
