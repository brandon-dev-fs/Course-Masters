-- CreateEnum
CREATE TYPE "CourseSpecStatus" AS ENUM ('drafting', 'reviewing', 'approved', 'building', 'completed', 'failed');

-- CreateTable
CREATE TABLE "trusted_source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "contentTypes" JSONB NOT NULL,
    "categories" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trusted_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_spec" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "status" "CourseSpecStatus" NOT NULL DEFAULT 'drafting',
    "elicitationData" JSONB,
    "outline" JSONB,
    "buildLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_spec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseSpecId" TEXT,
    "phase" TEXT NOT NULL,
    "currentStep" TEXT,
    "elicitationState" JSONB,
    "conversationLog" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trusted_source_domain_key" ON "trusted_source"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "course_spec_courseId_key" ON "course_spec"("courseId");

-- CreateIndex
CREATE INDEX "course_spec_userId_idx" ON "course_spec"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_session_courseSpecId_key" ON "agent_session"("courseSpecId");

-- CreateIndex
CREATE INDEX "agent_session_userId_idx" ON "agent_session"("userId");

-- AddForeignKey
ALTER TABLE "course_spec" ADD CONSTRAINT "course_spec_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_spec" ADD CONSTRAINT "course_spec_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_courseSpecId_fkey" FOREIGN KEY ("courseSpecId") REFERENCES "course_spec"("id") ON DELETE SET NULL ON UPDATE CASCADE;
