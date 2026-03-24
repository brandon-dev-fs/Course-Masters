-- AlterTable: Add lesson plan fields
ALTER TABLE "Lesson" ADD COLUMN "objective" TEXT,
ADD COLUMN "planContent" JSONB;

-- AlterTable: Add title and order to Note with defaults for existing rows
ALTER TABLE "Note" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Lecture Notes',
ADD COLUMN "order" INTEGER NOT NULL DEFAULT 1;

-- Remove the defaults after migration (Prisma manages them)
ALTER TABLE "Note" ALTER COLUMN "title" DROP DEFAULT,
ALTER COLUMN "order" DROP DEFAULT;

-- Drop unique constraint on Note.lessonId (1:1 -> 1:many)
ALTER TABLE "Note" DROP CONSTRAINT "Note_lessonId_key";

-- CreateIndex for Note (replaces unique)
CREATE INDEX "Note_lessonId_idx" ON "Note"("lessonId");

-- CreateTable: LessonResourceCompletion
CREATE TABLE "lesson_resource_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_resource_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_resource_completions_userId_lessonId_idx" ON "lesson_resource_completions"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_resource_completions_userId_resourceType_resourceId_key" ON "lesson_resource_completions"("userId", "resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "lesson_resource_completions" ADD CONSTRAINT "lesson_resource_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resource_completions" ADD CONSTRAINT "lesson_resource_completions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
