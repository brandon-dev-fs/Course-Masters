import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';

export const progressService = {
  async getCourseProgress(courseId: string, userId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          include: {
            lessons: {
              include: {
                assessment: {
                  where: { type: 'lesson_quiz' },
                  include: {
                    attempts: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
                  },
                },
              },
            },
            assessment: {
              where: { type: 'unit_quiz' },
              include: {
                attempts: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
        assessment: {
          where: { type: 'course_exam' },
          include: {
            attempts: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!course) throw new NotFoundError('Course not found');

    const allLessons = course.units.flatMap(u => u.lessons);
    const completedLessons = allLessons.filter(
      l => l.assessment?.attempts[0]?.passed === true,
    );

    const completedUnits = course.units.filter(u => {
      const allLessonsPassed = u.lessons.every(
        l => l.assessment?.attempts[0]?.passed === true,
      );
      const testPassed = u.assessment?.attempts[0]?.passed === true;
      return allLessonsPassed && testPassed;
    });

    const lastExamAttempt = course.assessment?.attempts[0] ?? null;
    const examPassed = lastExamAttempt?.passed === true;
    const examScore = lastExamAttempt != null ? lastExamAttempt.score : null;
    const totalLessons = allLessons.length;
    const totalUnits = course.units.length;
    const lessonPercent = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 90);
    const percentComplete = examPassed ? 100 : lessonPercent;

    const unitStatuses = [...course.units]
      .sort((a, b) => a.order - b.order)
      .map(u => {
        const unitCompletedLessons = u.lessons.filter(
          l => l.assessment?.attempts[0]?.passed === true,
        );
        return {
          unitId: u.id,
          title: u.title,
          order: u.order,
          isComplete: completedUnits.some(cu => cu.id === u.id),
          totalLessons: u.lessons.length,
          completedLessons: unitCompletedLessons.length,
          testPassed: u.assessment?.attempts[0]?.passed === true,
          lessons: u.lessons.map(l => ({
            lessonId: l.id,
            hasQuiz: l.assessment !== null,
            attempted: (l.assessment?.attempts.length ?? 0) > 0,
            quizPassed: l.assessment?.attempts[0]?.passed === true,
          })),
        };
      });

    return {
      totalUnits,
      completedUnits: completedUnits.length,
      totalLessons,
      completedLessons: completedLessons.length,
      examPassed,
      examScore,
      percentComplete,
      units: unitStatuses,
    };
  },

  async getUnitProgress(unitId: string, userId: string) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        lessons: {
          include: {
            assessment: {
              where: { type: 'lesson_quiz' },
              include: {
                attempts: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        assessment: {
          where: { type: 'unit_quiz' },
          include: {
            attempts: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!unit) throw new NotFoundError('Unit not found');

    const completedLessons = unit.lessons.filter(
      l => l.assessment?.attempts[0]?.passed === true,
    );

    const testPassed = unit.assessment?.attempts[0]?.passed === true;
    const totalLessons = unit.lessons.length;
    const percentComplete = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

    return {
      totalLessons,
      completedLessons: completedLessons.length,
      testPassed,
      percentComplete,
      lessons: unit.lessons.map(l => ({
        lessonId: l.id,
        hasQuiz: l.assessment !== null,
        attempted: (l.assessment?.attempts.length ?? 0) > 0,
        quizPassed: l.assessment?.attempts[0]?.passed === true,
      })),
    };
  },
};
