/*
  Warnings:

  - You are about to drop the column `answer` on the `PracticeProblem` table. All the data in the column will be lost.
  - Added the required column `correctIndex` to the `PracticeProblem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `options` to the `PracticeProblem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "PracticeProblem" DROP COLUMN "answer",
ADD COLUMN     "correctIndex" INTEGER NOT NULL,
ADD COLUMN     "options" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "StudentNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocab" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "Vocab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentNote_lessonId_userId_key" ON "StudentNote"("lessonId", "userId");

-- AddForeignKey
ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vocab" ADD CONSTRAINT "Vocab_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
