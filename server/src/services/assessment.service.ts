import { AssessmentType, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { AppError, NotFoundError } from '../errors/index.js';
import type { BulkUpdateCalculatorInput, CreateAssessmentInput, SubmitAttemptInput } from '../schemas/assessment.schema.js';

// ---------------------------------------------------------------------------
// Private helper: resolve the courseId of any assessment regardless of type
// ---------------------------------------------------------------------------

async function resolveAssessmentCourseId(assessment: {
  lessonId: string | null;
  unitId: string | null;
  courseId: string | null;
}): Promise<string> {
  if (assessment.courseId) return assessment.courseId;
  if (assessment.unitId) {
    const unit = await prisma.unit.findUnique({
      where: { id: assessment.unitId },
      select: { courseId: true },
    });
    if (!unit) throw new NotFoundError('Unit not found');
    return unit.courseId;
  }
  if (assessment.lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: assessment.lessonId },
      select: { unit: { select: { courseId: true } } },
    });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return lesson.unit.courseId;
  }
  throw new NotFoundError('Assessment has no parent');
}

const PASS_THRESHOLD = 0.8;

function parentWhere(type: AssessmentType, parentId: string) {
  if (type === 'lesson_quiz') return { lessonId: parentId };
  if (type === 'unit_quiz') return { unitId: parentId };
  return { courseId: parentId };
}

/**
 * Assert the parent entity exists and is not soft-deleted.
 * Uses inline findFirst with deletedAt: null — does not use assertExists
 * since assertExists does not filter by deletedAt.
 */
async function assertParentExists(type: AssessmentType, parentId: string) {
  if (type === 'lesson_quiz') {
    const lesson = await prisma.lesson.findFirst({ where: { id: parentId, deletedAt: null } });
    if (!lesson) throw new NotFoundError('Lesson not found');
  } else if (type === 'unit_quiz') {
    const unit = await prisma.unit.findFirst({ where: { id: parentId, deletedAt: null } });
    if (!unit) throw new NotFoundError('Unit not found');
  } else {
    const course = await prisma.course.findFirst({ where: { id: parentId, deletedAt: null } });
    if (!course) throw new NotFoundError('Course not found');
  }
}

export const assessmentService = {
  async findByParent(type: AssessmentType, parentId: string, userId?: string) {
    // Check parent exists and is not soft-deleted
    await assertParentExists(type, parentId);

    // findFirst instead of findUnique so we can include deletedAt: null filter
    const assessment = await prisma.assessment.findFirst({
      where: { ...parentWhere(type, parentId), deletedAt: null },
      include: {
        questions: { orderBy: { order: 'asc' } },
        attempts: userId
          ? { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 }
          : { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!assessment) return null;

    const { attempts, ...rest } = assessment;
    const lastAttempt = attempts[0] ?? null;
    return {
      ...rest,
      lastAttempt: lastAttempt ? { score: lastAttempt.score, passed: lastAttempt.passed } : null,
    };
  },

  async create(type: AssessmentType, parentId: string, data: CreateAssessmentInput) {
    await assertParentExists(type, parentId);
    return prisma.assessment.create({
      data: {
        type,
        ...parentWhere(type, parentId),
        questions: { create: data.questions },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  async update(assessmentId: string, data: CreateAssessmentInput) {
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, deletedAt: null },
    });
    if (!assessment) throw new NotFoundError('Assessment not found');

    await prisma.assessmentQuestion.deleteMany({ where: { assessmentId } });
    return prisma.assessment.update({
      where: { id: assessmentId },
      data: { questions: { create: data.questions } },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  async submitAttempt(assessmentId: string, data: SubmitAttemptInput, userId: string) {
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, deletedAt: null },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!assessment) throw new NotFoundError('Assessment not found');

    const { answers } = data;
    let correct = 0;
    assessment.questions.forEach((q, i) => {
      const content = q.content as Record<string, unknown>;
      const answer = answers[i];
      if (q.type === 'multiple_choice') {
        if (answer === content['correctIndex']) correct++;
      } else if (q.type === 'true_false') {
        if (answer === content['correct']) correct++;
      } else if (q.type === 'fill_in_blank') {
        const blanks = content['blanks'] as { answer: string; alternatives?: string[] }[] | undefined;
        const answerArr = answer as string[] | null;
        if (Array.isArray(blanks) && Array.isArray(answerArr)) {
          if (blanks.every((blank, i) => {
            const given = (answerArr[i] ?? '').trim().toLowerCase();
            if (!given) return false;
            if (given === blank.answer.toLowerCase()) return true;
            return (blank.alternatives ?? []).some(alt => alt.toLowerCase() === given);
          })) correct++;
        }
      } else if (q.type === 'matching') {
        const pairs = content['pairs'] as { left: string; right: string }[] | undefined;
        const matchingAnswers = answer as string[] | null;
        if (Array.isArray(pairs) && Array.isArray(matchingAnswers)) {
          if (pairs.every((pair, i) =>
            (matchingAnswers[i] ?? '').trim().toLowerCase() === pair.right.trim().toLowerCase()
          )) correct++;
        }
      }
    });

    const total = assessment.questions.length;
    const score = total > 0 ? correct / total : 0;
    const passed = score >= PASS_THRESHOLD;

    const attempt = await prisma.assessmentAttempt.create({
      data: { assessmentId, userId, score, passed },
    });

    return { ...attempt, totalQuestions: total, correctCount: correct };
  },

  async getAttempts(assessmentId: string, userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [total, data] = await Promise.all([
      prisma.assessmentAttempt.count({
        where: { assessmentId, userId },
      }),
      prisma.assessmentAttempt.findMany({
        where: { assessmentId, userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, score: true, passed: true, createdAt: true },
        skip,
        take: pageSize,
      }),
    ]);

    return { data, total, page, pageSize };
  },

  async bulkUpdateCalculator(assessmentId: string, data: BulkUpdateCalculatorInput) {
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, deletedAt: null },
    });
    if (!assessment) throw new NotFoundError('Assessment not found');

    const found = await prisma.assessmentQuestion.findMany({
      where: { id: { in: data.questionIds }, assessmentId },
      select: { id: true },
    });
    if (found.length !== data.questionIds.length) {
      throw new AppError(
        'QUESTION_NOT_IN_ASSESSMENT',
        'One or more question IDs do not belong to this assessment',
        422,
      );
    }

    await prisma.assessmentQuestion.updateMany({
      where: { id: { in: data.questionIds }, assessmentId },
      data: { calculatorEnabled: data.calculatorEnabled },
    });

    const result = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!result) throw new NotFoundError('Assessment not found');
    return result;
  },

  async importQuestions(assessmentId: string, practiceProblemAssignmentId: string) {
    // 1. Verify assessment exists and is not soft-deleted
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, deletedAt: null },
      select: { id: true, lessonId: true, unitId: true, courseId: true },
    });
    if (!assessment) throw new NotFoundError('Assessment not found');

    // 2. Verify practice problem assignment exists and resolve its courseId
    const ppAssignment = await prisma.practiceProblemAssignment.findUnique({
      where: { id: practiceProblemAssignmentId },
      include: {
        assignment: {
          include: {
            lesson: {
              include: {
                unit: { select: { courseId: true } },
              },
            },
          },
        },
        questions: { orderBy: { order: 'asc' } },
      },
    });
    if (!ppAssignment) {
      throw new NotFoundError('Practice problem assignment not found');
    }

    // 3. Resolve the course ID of the assessment
    const assessmentCourseId = await resolveAssessmentCourseId(assessment);

    // 4. Verify same course
    const ppCourseId = ppAssignment.assignment.lesson.unit.courseId;
    if (assessmentCourseId !== ppCourseId) {
      throw new AppError(
        'FORBIDDEN',
        'Practice problem assignment must belong to the same course as the assessment',
        403,
      );
    }

    // 5. Determine next order value
    const maxOrderResult = await prisma.assessmentQuestion.aggregate({
      where: { assessmentId },
      _max: { order: true },
    });
    let nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    // 6. Create new AssessmentQuestion records from PracticeProblemQuestion data
    const newQuestions = await prisma.$transaction(
      ppAssignment.questions.map((ppq) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawContent = (ppq.content as any) ?? {};

        // For matching questions, strip the client-only `id` field from each pair
        // so the content conforms to the assessment matching schema {left, right}.
        let content: typeof rawContent = rawContent;
        if (ppq.type === 'matching' && Array.isArray(rawContent['pairs'])) {
          content = {
            ...rawContent,
            pairs: (rawContent['pairs'] as { id?: string; left: string; right: string }[]).map(
              ({ left, right }) => ({ left, right }),
            ),
          };
        }

        return prisma.assessmentQuestion.create({
          data: {
            assessmentId,
            type: ppq.type,
            question: (rawContent['question'] as string | undefined) ?? '',
            content: content ?? Prisma.JsonNull,
            order: nextOrder++,
            calculatorEnabled: (rawContent['calculatorEnabled'] as boolean | undefined) ?? false,
          },
        });
      }),
    );

    return newQuestions;
  },
};
