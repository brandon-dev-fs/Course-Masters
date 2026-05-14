-- AlterTable: add deletedAt to User
ALTER TABLE "user" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: add deletedAt to Course
ALTER TABLE "Course" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: add deletedAt to Unit
ALTER TABLE "Unit" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: add deletedAt to Lesson
ALTER TABLE "Lesson" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: add deletedAt to Assessment
ALTER TABLE "assessment" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Partial indexes: only index rows where deletedAt IS NOT NULL (soft-deleted records)
-- This keeps the hot-path WHERE deletedAt IS NULL queries efficient while still
-- providing index support for administrative lookups of soft-deleted records.
CREATE INDEX IF NOT EXISTS "user_deleted_at_idx" ON "user"("deletedAt") WHERE "deletedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Course_deleted_at_idx" ON "Course"("deletedAt") WHERE "deletedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Unit_deleted_at_idx" ON "Unit"("deletedAt") WHERE "deletedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Lesson_deleted_at_idx" ON "Lesson"("deletedAt") WHERE "deletedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "assessment_deleted_at_idx" ON "assessment"("deletedAt") WHERE "deletedAt" IS NOT NULL;
