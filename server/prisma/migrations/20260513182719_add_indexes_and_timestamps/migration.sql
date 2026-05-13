-- Add missing FK indexes
CREATE INDEX "lesson_completion_lessonId_idx" ON "lesson_completion"("lessonId");
CREATE INDEX "unit_completion_unitId_idx" ON "unit_completion"("unitId");
CREATE INDEX "StudentNote_lessonId_idx" ON "StudentNote"("lessonId");
CREATE INDEX "assignment_completion_assignmentId_idx" ON "assignment_completion"("assignmentId");

-- Add audit timestamps to Unit
ALTER TABLE "Unit" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Unit" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add audit timestamps to Lesson
ALTER TABLE "Lesson" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Lesson" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add audit timestamps to lesson_resource
ALTER TABLE "lesson_resource" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "lesson_resource" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add audit timestamps to lesson_tool
ALTER TABLE "lesson_tool" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "lesson_tool" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add audit timestamps to assessment_question
ALTER TABLE "assessment_question" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "assessment_question" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
