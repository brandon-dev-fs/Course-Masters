import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';

// ── Payload types derived from the Prisma schema ─────────────────────────────
// These stay in sync automatically with future schema changes.

type CourseProgressData = Prisma.CourseGetPayload<{
  include: {
    units: {
      include: {
        lessons: {
          include: {
            assessment: {
              where: { type: 'lesson_quiz' };
              include: { attempts: true };
            };
          };
        };
        assessment: {
          where: { type: 'unit_quiz' };
          include: { attempts: true };
        };
      };
    };
    assessment: {
      where: { type: 'course_exam' };
      include: { attempts: true };
    };
  };
}>;

type UnitProgressData = Prisma.UnitGetPayload<{
  include: {
    lessons: {
      include: {
        assessment: {
          where: { type: 'lesson_quiz' };
          include: { attempts: true };
        };
      };
    };
    assessment: {
      where: { type: 'unit_quiz' };
      include: { attempts: true };
    };
  };
}>;

// ── Result types ─────────────────────────────────────────────────────────────

type LessonProgressItem = {
  lessonId: string;
  hasQuiz: boolean;
  attempted: boolean;
  quizPassed: boolean;
};

type UnitProgressItem = {
  unitId: string;
  title: string;
  order: number;
  isComplete: boolean;
  totalLessons: number;
  completedLessons: number;
  testPassed: boolean;
  lessons: LessonProgressItem[];
};

type CourseProgressResult = {
  totalUnits: number;
  completedUnits: number;
  totalLessons: number;
  completedLessons: number;
  examPassed: boolean;
  examScore: number | null;
  percentComplete: number;
  units: UnitProgressItem[];
};

type UnitProgressResult = {
  totalLessons: number;
  completedLessons: number;
  testPassed: boolean;
  percentComplete: number;
  lessons: LessonProgressItem[];
};

// ── Data fetching functions ───────────────────────────────────────────────────
// Deep-include queries cannot be expressed through the assertExists delegate
// without losing the typed return shape, so inline null checks are used here.

export async function fetchCourseProgressData(
  courseId: string,
  userId: string,
): Promise<CourseProgressData> {
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
  return course;
}

export async function fetchUnitProgressData(
  unitId: string,
  userId: string,
): Promise<UnitProgressData> {
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
  return unit;
}

// ── Pure computation functions ────────────────────────────────────────────────
// No Prisma access, no side effects — safe to unit test with mock data.

export function computeCourseProgress(data: CourseProgressData): CourseProgressResult {
  const allLessons = data.units.flatMap(u => u.lessons);
  const completedLessons = allLessons.filter(
    l => l.assessment?.attempts[0]?.passed === true,
  );

  const completedUnits = data.units.filter(u => {
    const allLessonsPassed = u.lessons.every(
      l => l.assessment?.attempts[0]?.passed === true,
    );
    const testPassed = u.assessment?.attempts[0]?.passed === true;
    return allLessonsPassed && testPassed;
  });

  const lastExamAttempt = data.assessment?.attempts[0] ?? null;
  const examPassed = lastExamAttempt?.passed === true;
  const examScore = lastExamAttempt != null ? lastExamAttempt.score : null;
  const totalLessons = allLessons.length;
  const totalUnits = data.units.length;
  const lessonPercent = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 90);
  const percentComplete = examPassed ? 100 : lessonPercent;

  const unitStatuses: UnitProgressItem[] = [...data.units]
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
}

export function computeUnitProgress(data: UnitProgressData): UnitProgressResult {
  const completedLessons = data.lessons.filter(
    l => l.assessment?.attempts[0]?.passed === true,
  );

  const testPassed = data.assessment?.attempts[0]?.passed === true;
  const totalLessons = data.lessons.length;
  const percentComplete = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons: completedLessons.length,
    testPassed,
    percentComplete,
    lessons: data.lessons.map(l => ({
      lessonId: l.id,
      hasQuiz: l.assessment !== null,
      attempted: (l.assessment?.attempts.length ?? 0) > 0,
      quizPassed: l.assessment?.attempts[0]?.passed === true,
    })),
  };
}

// ── Public service ────────────────────────────────────────────────────────────

export const progressService = {
  async getCourseProgress(courseId: string, userId: string) {
    const data = await fetchCourseProgressData(courseId, userId);
    return computeCourseProgress(data);
  },

  async getUnitProgress(unitId: string, userId: string) {
    const data = await fetchUnitProgressData(unitId, userId);
    return computeUnitProgress(data);
  },
};
