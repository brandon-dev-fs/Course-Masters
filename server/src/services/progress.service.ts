import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';

export const progressService = {
  async getCourseProgress(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          include: {
            lessons: {
              include: {
                quiz: {
                  include: {
                    attempts: { orderBy: { createdAt: 'desc' }, take: 1 },
                  },
                },
              },
            },
            test: {
              include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } },
            },
          },
        },
        finalExam: {
          include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
    });

    if (!course) throw new NotFoundError('Course not found');

    const allLessons = course.units.flatMap(u => u.lessons);
    const completedLessons = allLessons.filter(
      l => l.quiz?.attempts[0]?.passed === true,
    );

    const completedUnits = course.units.filter(u => {
      const allLessonsPassed = u.lessons.every(
        l => l.quiz?.attempts[0]?.passed === true,
      );
      const testPassed = u.test?.attempts[0]?.passed === true;
      return allLessonsPassed && testPassed;
    });

    const examPassed = course.finalExam?.attempts[0]?.passed === true;
    const totalLessons = allLessons.length;
    const totalUnits = course.units.length;
    const percentComplete = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

    return {
      totalUnits,
      completedUnits: completedUnits.length,
      totalLessons,
      completedLessons: completedLessons.length,
      examPassed,
      percentComplete,
    };
  },

  async getUnitProgress(unitId: string) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        lessons: {
          include: {
            quiz: {
              include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } },
            },
          },
          orderBy: { order: 'asc' },
        },
        test: {
          include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
    });

    if (!unit) throw new NotFoundError('Unit not found');

    const completedLessons = unit.lessons.filter(
      l => l.quiz?.attempts[0]?.passed === true,
    );

    const testPassed = unit.test?.attempts[0]?.passed === true;
    const totalLessons = unit.lessons.length;
    const percentComplete = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

    return {
      totalLessons,
      completedLessons: completedLessons.length,
      testPassed,
      percentComplete,
      lessons: unit.lessons.map(l => ({
        lessonId: l.id,
        hasQuiz: l.quiz !== null,
        attempted: (l.quiz?.attempts.length ?? 0) > 0,
        quizPassed: l.quiz?.attempts[0]?.passed === true,
      })),
    };
  },
};
