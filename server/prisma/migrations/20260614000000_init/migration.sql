-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'teacher', 'admin');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('lesson_quiz', 'unit_quiz', 'course_exam');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('multiple_choice', 'true_false', 'matching', 'fill_in_blank');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('note', 'video', 'reading', 'vocab', 'practice_problem');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "syllabus" JSONB,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "planContent" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment" (
    "id" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "lessonId" TEXT,
    "unitId" TEXT,
    "courseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_question" (
    "id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'multiple_choice',
    "question" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "calculatorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempt" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "type" "AssignmentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "note_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "video_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "estimatedMinutes" INTEGER,

    CONSTRAINT "reading_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,

    CONSTRAINT "vocab_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_assignment_entry" (
    "id" TEXT NOT NULL,
    "vocabAssignmentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "example" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocab_assignment_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_vocab_assignment_flash_card" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_vocab_assignment_flash_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_problem_assignment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "passingPercentage" INTEGER,

    CONSTRAINT "practice_problem_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_problem_question" (
    "id" TEXT NOT NULL,
    "practiceProblemAssignmentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "practice_problem_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "note" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_checklist_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "text" VARCHAR(200) NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_checklist_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "course_authorId_idx" ON "course"("authorId");

-- CreateIndex
CREATE INDEX "unit_courseId_idx" ON "unit"("courseId");

-- CreateIndex
CREATE INDEX "lesson_unitId_idx" ON "lesson"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_lessonId_key" ON "assessment"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_unitId_key" ON "assessment"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_courseId_key" ON "assessment"("courseId");

-- CreateIndex
CREATE INDEX "assessment_question_assessmentId_idx" ON "assessment_question"("assessmentId");

-- CreateIndex
CREATE INDEX "assessment_attempt_assessmentId_idx" ON "assessment_attempt"("assessmentId");

-- CreateIndex
CREATE INDEX "assessment_attempt_userId_idx" ON "assessment_attempt"("userId");

-- CreateIndex
CREATE INDEX "student_note_userId_idx" ON "student_note"("userId");

-- CreateIndex
CREATE INDEX "student_note_lessonId_idx" ON "student_note"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "student_note_lessonId_userId_key" ON "student_note"("lessonId", "userId");

-- CreateIndex
CREATE INDEX "lesson_completion_userId_idx" ON "lesson_completion"("userId");

-- CreateIndex
CREATE INDEX "lesson_completion_lessonId_idx" ON "lesson_completion"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_completion_userId_lessonId_key" ON "lesson_completion"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "unit_completion_userId_idx" ON "unit_completion"("userId");

-- CreateIndex
CREATE INDEX "unit_completion_unitId_idx" ON "unit_completion"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_completion_userId_unitId_key" ON "unit_completion"("userId", "unitId");

-- CreateIndex
CREATE INDEX "assignment_lessonId_idx" ON "assignment"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_lessonId_order_key" ON "assignment"("lessonId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "note_assignment_assignmentId_key" ON "note_assignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "video_assignment_assignmentId_key" ON "video_assignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "reading_assignment_assignmentId_key" ON "reading_assignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "vocab_assignment_assignmentId_key" ON "vocab_assignment"("assignmentId");

-- CreateIndex
CREATE INDEX "vocab_assignment_entry_vocabAssignmentId_idx" ON "vocab_assignment_entry"("vocabAssignmentId");

-- CreateIndex
CREATE INDEX "student_vocab_assignment_flash_card_userId_idx" ON "student_vocab_assignment_flash_card"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_vocab_assignment_flash_card_userId_entryId_key" ON "student_vocab_assignment_flash_card"("userId", "entryId");

-- CreateIndex
CREATE UNIQUE INDEX "practice_problem_assignment_assignmentId_key" ON "practice_problem_assignment"("assignmentId");

-- CreateIndex
CREATE INDEX "practice_problem_question_practiceProblemAssignmentId_idx" ON "practice_problem_question"("practiceProblemAssignmentId");

-- CreateIndex
CREATE INDEX "assignment_completion_userId_idx" ON "assignment_completion"("userId");

-- CreateIndex
CREATE INDEX "assignment_completion_assignmentId_idx" ON "assignment_completion"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_completion_userId_assignmentId_key" ON "assignment_completion"("userId", "assignmentId");

-- CreateIndex
CREATE INDEX "activity_bookmark_userId_idx" ON "activity_bookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_bookmark_userId_assignmentId_key" ON "activity_bookmark"("userId", "assignmentId");

-- CreateIndex
CREATE INDEX "lesson_checklist_item_userId_lessonId_idx" ON "lesson_checklist_item"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_question" ADD CONSTRAINT "assessment_question_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_note" ADD CONSTRAINT "student_note_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_note" ADD CONSTRAINT "student_note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completion" ADD CONSTRAINT "lesson_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completion" ADD CONSTRAINT "lesson_completion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_completion" ADD CONSTRAINT "unit_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_completion" ADD CONSTRAINT "unit_completion_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_assignment" ADD CONSTRAINT "note_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_assignment" ADD CONSTRAINT "video_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_assignment" ADD CONSTRAINT "reading_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_assignment" ADD CONSTRAINT "vocab_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_assignment_entry" ADD CONSTRAINT "vocab_assignment_entry_vocabAssignmentId_fkey" FOREIGN KEY ("vocabAssignmentId") REFERENCES "vocab_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_vocab_assignment_flash_card" ADD CONSTRAINT "student_vocab_assignment_flash_card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_vocab_assignment_flash_card" ADD CONSTRAINT "student_vocab_assignment_flash_card_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "vocab_assignment_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_problem_assignment" ADD CONSTRAINT "practice_problem_assignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_problem_question" ADD CONSTRAINT "practice_problem_question_practiceProblemAssignmentId_fkey" FOREIGN KEY ("practiceProblemAssignmentId") REFERENCES "practice_problem_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_completion" ADD CONSTRAINT "assignment_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_completion" ADD CONSTRAINT "assignment_completion_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_bookmark" ADD CONSTRAINT "activity_bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_bookmark" ADD CONSTRAINT "activity_bookmark_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_checklist_item" ADD CONSTRAINT "lesson_checklist_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_checklist_item" ADD CONSTRAINT "lesson_checklist_item_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
