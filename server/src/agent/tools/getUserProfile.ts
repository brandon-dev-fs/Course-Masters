import { tool } from 'ai';
import { z } from 'zod';

import prisma from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

export function makeGetUserProfileTool(userId: string) {
  return tool({
    description:
      'Load the current user profile including enrolled courses, completion progress, and recent assessment scores. Call this automatically at session start.',
    inputSchema: z.object({}),
    execute: async () => {
      // Fetch lesson completions and recent assessment attempts in parallel
      const [lessonCompletions, recentAttempts, user] = await Promise.all([
        prisma.lessonCompletion.findMany({
          where: { userId },
          select: {
            lessonId: true,
            lesson: { select: { unit: { select: { courseId: true } } } },
          },
        }),
        prisma.assessmentAttempt.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            score: true,
            passed: true,
            createdAt: true,
            assessment: {
              select: {
                type: true,
                course: { select: { title: true } },
                unit: { select: { title: true } },
                lesson: { select: { title: true } },
              },
            },
          },
        }),
        prisma.user.findFirst({
          where: { id: userId },
          select: { id: true, name: true, role: true, createdAt: true },
        }),
      ]);

      // Deduplicate course IDs from lesson completions
      const courseIds = [
        ...new Set(lessonCompletions.map((c) => c.lesson.unit.courseId)),
      ];

      // Fetch course data for those course IDs
      const courses = courseIds.length > 0
        ? await prisma.course.findMany({
            where: { id: { in: courseIds }, deletedAt: null },
            select: {
              id: true,
              title: true,
              units: {
                where: { deletedAt: null },
                select: {
                  lessons: {
                    where: { deletedAt: null },
                    select: { id: true },
                  },
                },
              },
            },
          })
        : [];

      // Build set of completed lesson IDs
      const completedLessonIds = new Set(lessonCompletions.map((c) => c.lessonId));

      // Compute per-course progress
      const enrolledCourses = courses.map((course) => {
        const allLessonIds = course.units.flatMap((u) => u.lessons.map((l) => l.id));
        const totalLessons = allLessonIds.length;
        const completedLessons = allLessonIds.filter((id) => completedLessonIds.has(id)).length;
        const percentComplete =
          totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

        return {
          courseId: course.id,
          title: course.title,
          completedLessons,
          totalLessons,
          percentComplete,
        };
      });

      // Format recent assessment attempts
      const recentAssessments = recentAttempts.map((attempt) => ({
        type: attempt.assessment.type,
        contextName:
          attempt.assessment.course?.title ??
          attempt.assessment.unit?.title ??
          attempt.assessment.lesson?.title ??
          'Unknown',
        score: attempt.score,
        passed: attempt.passed,
        date: attempt.createdAt.toISOString(),
      }));

      logger.info({ userId }, 'User profile loaded for agent pre-load');

      return {
        user: {
          name: user?.name ?? 'Unknown',
          role: user?.role ?? 'student',
          memberSince: user?.createdAt.toISOString() ?? '',
        },
        enrolledCourses,
        recentAssessments,
      };
    },
  });
}
