-- CreateEnum
CREATE TYPE "CourseSpecStatus" AS ENUM ('drafting', 'reviewing', 'approved', 'building', 'completed', 'failed');

-- CreateTable
CREATE TABLE "trusted_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "contentTypes" JSONB NOT NULL,
    "categories" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trusted_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_specs" (
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

    CONSTRAINT "course_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_sessions" (
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

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trusted_sources_domain_key" ON "trusted_sources"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "course_specs_courseId_key" ON "course_specs"("courseId");

-- CreateIndex
CREATE INDEX "course_specs_userId_idx" ON "course_specs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_sessions_courseSpecId_key" ON "agent_sessions"("courseSpecId");

-- CreateIndex
CREATE INDEX "agent_sessions_userId_idx" ON "agent_sessions"("userId");

-- AddForeignKey
ALTER TABLE "course_specs" ADD CONSTRAINT "course_specs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_specs" ADD CONSTRAINT "course_specs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_courseSpecId_fkey" FOREIGN KEY ("courseSpecId") REFERENCES "course_specs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
