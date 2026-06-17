import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Prisma, AssessmentQuestion } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

// Import after vi.mock so the mock is in place
import { assessmentService } from '../../services/assessment.service.js';
import { AppError, NotFoundError } from '../../errors/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AssessmentWithQuestions = Prisma.AssessmentGetPayload<{ include: { questions: true } }>;

function makeQuestion(overrides: Partial<AssessmentQuestion>): AssessmentQuestion {
  return {
    id: 'q-1',
    assessmentId: 'a-1',
    type: 'multiple_choice',
    question: 'Test question',
    order: 0,
    calculatorEnabled: false,
    content: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<AssessmentWithQuestions> = {}): AssessmentWithQuestions {
  return {
    id: 'a-1',
    type: 'lesson_quiz',
    lessonId: 'lesson-1',
    unitId: null,
    courseId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [],
    ...overrides,
  };
}

const USER_ID = 'user-1';
const ASSESSMENT_ID = 'a-1';

// ---------------------------------------------------------------------------
// submitAttempt
// ---------------------------------------------------------------------------

describe('assessmentService.submitAttempt', () => {
  beforeEach(() => {
    // Default: create attempt returns a stub
    prismaMock.assessmentAttempt.create.mockResolvedValue({
      id: 'attempt-1',
      assessmentId: ASSESSMENT_ID,
      userId: USER_ID,
      score: 0,
      passed: false,
      createdAt: new Date(),
    });
  });

  // -------------------------------------------------------------------------
  // Assessment not found
  // -------------------------------------------------------------------------

  it('throws NotFoundError when assessment does not exist', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(null);

    await expect(
      assessmentService.submitAttempt(ASSESSMENT_ID, { answers: [] }, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NOT_FOUND code when assessment does not exist', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(null);

    await expect(
      assessmentService.submitAttempt(ASSESSMENT_ID, { answers: [] }, USER_ID),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  // -------------------------------------------------------------------------
  // Empty question set
  // -------------------------------------------------------------------------

  it('returns score 0 and passed false for empty question set', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions: [] }));
    prismaMock.assessmentAttempt.create.mockResolvedValue({
      id: 'attempt-1',
      assessmentId: ASSESSMENT_ID,
      userId: USER_ID,
      score: 0,
      passed: false,
      createdAt: new Date(),
    });

    const result = await assessmentService.submitAttempt(
      ASSESSMENT_ID,
      { answers: [] },
      USER_ID,
    );

    expect(result.totalQuestions).toBe(0);
    expect(result.correctCount).toBe(0);
    // Prisma create should have been called with score 0 and passed false
    expect(prismaMock.assessmentAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ score: 0, passed: false }) }),
    );
  });

  // -------------------------------------------------------------------------
  // multiple_choice grading
  // -------------------------------------------------------------------------

  describe('multiple_choice grading', () => {
    it('scores 100% when all answers match correctIndex', async () => {
      const questions = [
        makeQuestion({ type: 'multiple_choice', content: { correctIndex: 2 } }),
        makeQuestion({ id: 'q-2', type: 'multiple_choice', content: { correctIndex: 0 } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 1, passed: true, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [2, 0] },
        USER_ID,
      );

      expect(result.correctCount).toBe(2);
      expect(result.totalQuestions).toBe(2);
      expect(prismaMock.assessmentAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ score: 1, passed: true }),
        }),
      );
    });

    it('scores 0% when all answers are wrong', async () => {
      const questions = [
        makeQuestion({ type: 'multiple_choice', content: { correctIndex: 1 } }),
        makeQuestion({ id: 'q-2', type: 'multiple_choice', content: { correctIndex: 3 } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 0, passed: false, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [0, 0] },
        USER_ID,
      );

      expect(result.correctCount).toBe(0);
      expect(prismaMock.assessmentAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ score: 0, passed: false }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // true_false grading
  // -------------------------------------------------------------------------

  describe('true_false grading', () => {
    it('counts correct when answer matches boolean correctAnswer', async () => {
      const questions = [
        makeQuestion({ type: 'true_false', content: { correctAnswer: true } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 1, passed: true, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [true] },
        USER_ID,
      );

      expect(result.correctCount).toBe(1);
      expect(prismaMock.assessmentAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ score: 1, passed: true }),
        }),
      );
    });

    it('counts incorrect when answer does not match correctAnswer', async () => {
      const questions = [
        makeQuestion({ type: 'true_false', content: { correctAnswer: true } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 0, passed: false, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [false] },
        USER_ID,
      );

      expect(result.correctCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // fill_in_blank grading
  // -------------------------------------------------------------------------

  describe('fill_in_blank grading', () => {
    it('counts correct when answer matches an accepted answer case-insensitively', async () => {
      const questions = [
        makeQuestion({
          type: 'fill_in_blank',
          content: { acceptedAnswers: ['Paris', 'paris'] },
        }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 1, passed: true, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: ['PARIS'] },
        USER_ID,
      );

      expect(result.correctCount).toBe(1);
    });

    it('counts incorrect when answer is not in acceptedAnswers', async () => {
      const questions = [
        makeQuestion({
          type: 'fill_in_blank',
          content: { acceptedAnswers: ['Paris'] },
        }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 0, passed: false, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: ['London'] },
        USER_ID,
      );

      expect(result.correctCount).toBe(0);
    });

    it('matches case-insensitively for mixed-case input', async () => {
      const questions = [
        makeQuestion({
          type: 'fill_in_blank',
          content: { acceptedAnswers: ['photosynthesis'] },
        }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 1, passed: true, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: ['Photosynthesis'] },
        USER_ID,
      );

      expect(result.correctCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // matching grading
  // -------------------------------------------------------------------------

  describe('matching grading', () => {
    it('counts correct when answer pairs match content pairs exactly (deep equality)', async () => {
      const pairs = [
        { left: 'A', right: '1' },
        { left: 'B', right: '2' },
      ];
      const questions = [
        makeQuestion({ type: 'matching', content: { pairs } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 1, passed: true, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [pairs] },
        USER_ID,
      );

      expect(result.correctCount).toBe(1);
    });

    it('counts incorrect when pairs are in different order', async () => {
      const correctPairs = [
        { left: 'A', right: '1' },
        { left: 'B', right: '2' },
      ];
      const wrongOrderPairs = [
        { left: 'B', right: '2' },
        { left: 'A', right: '1' },
      ];
      const questions = [
        makeQuestion({ type: 'matching', content: { pairs: correctPairs } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 0, passed: false, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [wrongOrderPairs] },
        USER_ID,
      );

      // Grading uses JSON.stringify comparison which is order-sensitive
      expect(result.correctCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Pass threshold
  // -------------------------------------------------------------------------

  describe('pass threshold', () => {
    it('passes at exactly 80% score (4 out of 5 correct)', async () => {
      // 4 correct multiple_choice + 1 wrong = 80%
      const questions = Array.from({ length: 5 }, (_, i) =>
        makeQuestion({ id: `q-${i}`, type: 'multiple_choice', content: { correctIndex: 1 }, order: i }),
      );
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 0.8, passed: true, createdAt: new Date(),
      });

      // 4 correct (index 1) + 1 wrong (index 0)
      await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [1, 1, 1, 1, 0] },
        USER_ID,
      );

      expect(prismaMock.assessmentAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ score: 0.8, passed: true }),
        }),
      );
    });

    it('fails below 80% score (3 out of 5 correct = 60%)', async () => {
      const questions = Array.from({ length: 5 }, (_, i) =>
        makeQuestion({ id: `q-${i}`, type: 'multiple_choice', content: { correctIndex: 1 }, order: i }),
      );
      prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 0.6, passed: false, createdAt: new Date(),
      });

      // 3 correct + 2 wrong
      await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [1, 1, 1, 0, 0] },
        USER_ID,
      );

      expect(prismaMock.assessmentAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ score: 0.6, passed: false }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Return value shape
  // -------------------------------------------------------------------------

  it('returns attempt enriched with totalQuestions and correctCount', async () => {
    const questions = [
      makeQuestion({ type: 'multiple_choice', content: { correctIndex: 1 } }),
    ];
    prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment({ questions }));
    const createdAttempt = {
      id: 'attempt-99',
      assessmentId: ASSESSMENT_ID,
      userId: USER_ID,
      score: 1,
      passed: true,
      createdAt: new Date(),
    };
    prismaMock.assessmentAttempt.create.mockResolvedValue(createdAttempt);

    const result = await assessmentService.submitAttempt(
      ASSESSMENT_ID,
      { answers: [1] },
      USER_ID,
    );

    expect(result).toMatchObject({
      id: 'attempt-99',
      score: 1,
      passed: true,
      totalQuestions: 1,
      correctCount: 1,
    });
  });
});

// ---------------------------------------------------------------------------
// findByParent
// ---------------------------------------------------------------------------

describe('assessmentService.findByParent', () => {
  const mockLesson = { id: 'lesson-1', deletedAt: null };
  const mockUnit = { id: 'unit-1', deletedAt: null };
  const mockCourse = { id: 'course-1', deletedAt: null };

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findFirst.mockResolvedValue(mockLesson);
    prismaMock.unit.findFirst.mockResolvedValue(mockUnit);
    prismaMock.course.findFirst.mockResolvedValue(mockCourse);
  });

  it('returns null when no assessment exists for lesson', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(null);
    const result = await assessmentService.findByParent('lesson_quiz', 'lesson-1');
    expect(result).toBeNull();
  });

  it('returns assessment with lastAttempt when attempts exist', async () => {
    const attempt = { score: 0.9, passed: true };
    prismaMock.assessment.findFirst.mockResolvedValue(
      { ...makeAssessment(), attempts: [attempt] } as unknown as ReturnType<typeof makeAssessment>,
    );
    const result = await assessmentService.findByParent('lesson_quiz', 'lesson-1', USER_ID);
    expect(result?.lastAttempt).toMatchObject({ score: 0.9, passed: true });
  });

  it('returns lastAttempt as null when no attempts exist', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(
      { ...makeAssessment(), attempts: [] } as unknown as ReturnType<typeof makeAssessment>,
    );
    const result = await assessmentService.findByParent('lesson_quiz', 'lesson-1');
    expect(result?.lastAttempt).toBeNull();
  });

  it('queries unit for unit_quiz type', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(null);
    await assessmentService.findByParent('unit_quiz', 'unit-1');
    expect(prismaMock.unit.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'unit-1', deletedAt: null } }),
    );
  });

  it('queries course for course_exam type', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(null);
    await assessmentService.findByParent('course_exam', 'course-1');
    expect(prismaMock.course.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'course-1', deletedAt: null } }),
    );
  });

  it('throws NotFoundError when lesson parent does not exist', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    await expect(assessmentService.findByParent('lesson_quiz', 'lesson-99')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when unit parent does not exist', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(null);
    await expect(assessmentService.findByParent('unit_quiz', 'unit-99')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when course parent does not exist', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);
    await expect(assessmentService.findByParent('course_exam', 'course-99')).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('assessmentService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findFirst.mockResolvedValue({ id: 'lesson-1', deletedAt: null });
    prismaMock.unit.findFirst.mockResolvedValue({ id: 'unit-1', deletedAt: null });
    prismaMock.course.findFirst.mockResolvedValue({ id: 'course-1', deletedAt: null });
    prismaMock.assessment.create.mockResolvedValue(makeAssessment());
  });

  it('creates a lesson_quiz with questions', async () => {
    const data = {
      questions: [{ type: 'multiple_choice' as const, question: 'Q?', content: { options: ['A'], correctIndex: 0 }, order: 0, calculatorEnabled: false }],
    };
    await assessmentService.create('lesson_quiz', 'lesson-1', data);
    expect(prismaMock.assessment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'lesson_quiz', lessonId: 'lesson-1' }) }),
    );
  });

  it('creates a unit_quiz using unitId in parentWhere', async () => {
    const data = {
      questions: [{ type: 'true_false' as const, question: 'Q?', content: { correctAnswer: true }, order: 0, calculatorEnabled: false }],
    };
    await assessmentService.create('unit_quiz', 'unit-1', data);
    expect(prismaMock.assessment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ unitId: 'unit-1' }) }),
    );
  });

  it('creates a course_exam using courseId in parentWhere', async () => {
    const data = {
      questions: [{ type: 'fill_in_blank' as const, question: 'Q?', content: { acceptedAnswers: ['A'] }, order: 0, calculatorEnabled: false }],
    };
    await assessmentService.create('course_exam', 'course-1', data);
    expect(prismaMock.assessment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ courseId: 'course-1' }) }),
    );
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('assessmentService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assessmentQuestion.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.assessment.update.mockResolvedValue(makeAssessment());
  });

  it('replaces questions and returns updated assessment', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment());
    const data = {
      questions: [{ type: 'multiple_choice' as const, question: 'Updated?', content: { options: ['A'], correctIndex: 0 }, order: 0, calculatorEnabled: false }],
    };
    await assessmentService.update(ASSESSMENT_ID, data);
    expect(prismaMock.assessmentQuestion.deleteMany).toHaveBeenCalledWith({ where: { assessmentId: ASSESSMENT_ID } });
    expect(prismaMock.assessment.update).toHaveBeenCalled();
  });

  it('throws NotFoundError when assessment does not exist', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(null);
    await expect(
      assessmentService.update(ASSESSMENT_ID, { questions: [] }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// getAttempts
// ---------------------------------------------------------------------------

describe('assessmentService.getAttempts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated attempts with total count', async () => {
    prismaMock.assessmentAttempt.count.mockResolvedValue(3);
    prismaMock.assessmentAttempt.findMany.mockResolvedValue([
      { id: 'att-1', score: 0.9, passed: true, createdAt: new Date() },
    ] as never);

    const result = await assessmentService.getAttempts(ASSESSMENT_ID, USER_ID, 1, 20);

    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.data).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// bulkUpdateCalculator
// ---------------------------------------------------------------------------

describe('assessmentService.bulkUpdateCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assessment.findFirst.mockResolvedValue(makeAssessment());
    prismaMock.assessmentQuestion.findMany.mockResolvedValue(
      [{ id: 'q-1' }] as never,
    );
    prismaMock.assessmentQuestion.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.assessment.findUnique.mockResolvedValue(makeAssessment());
  });

  it('updates calculator enabled flag for valid question IDs', async () => {
    await assessmentService.bulkUpdateCalculator(ASSESSMENT_ID, {
      questionIds: ['q-1'],
      calculatorEnabled: true,
    });
    expect(prismaMock.assessmentQuestion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { calculatorEnabled: true } }),
    );
  });

  it('throws AppError when question IDs do not all belong to assessment', async () => {
    // 1 found but 2 requested
    prismaMock.assessmentQuestion.findMany.mockResolvedValue(
      [{ id: 'q-1' }] as never,
    );
    await expect(
      assessmentService.bulkUpdateCalculator(ASSESSMENT_ID, {
        questionIds: ['q-1', 'q-missing'],
        calculatorEnabled: false,
      }),
    ).rejects.toMatchObject({ code: 'QUESTION_NOT_IN_ASSESSMENT' });
  });

  it('throws NotFoundError when assessment does not exist', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(null);
    await expect(
      assessmentService.bulkUpdateCalculator(ASSESSMENT_ID, { questionIds: ['q-1'], calculatorEnabled: true }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// importQuestions
// ---------------------------------------------------------------------------

const PP_ASSIGNMENT_ID = 'pp-assign-1';
const COURSE_ID = 'course-1';

function makePPAssignment(overrides: Record<string, unknown> = {}) {
  return {
    id: PP_ASSIGNMENT_ID,
    assignmentId: 'assign-1',
    passingPercentage: null,
    assignment: {
      id: 'assign-1',
      lessonId: 'lesson-1',
      lesson: {
        id: 'lesson-1',
        unitId: 'unit-1',
        unit: { courseId: COURSE_ID },
      },
    },
    questions: [],
    ...overrides,
  };
}

describe('assessmentService.importQuestions', () => {
  const mockAssessment = {
    id: ASSESSMENT_ID,
    type: 'lesson_quiz' as const,
    lessonId: 'lesson-1',
    unitId: null,
    courseId: null,
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assessmentQuestion.aggregate.mockResolvedValue({ _max: { order: null } } as never);
    prismaMock.$transaction.mockImplementation((queries: unknown) =>
      Promise.all(queries as Promise<unknown>[]),
    );
  });

  it('throws NotFoundError when assessment does not exist', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(null);

    await expect(
      assessmentService.importQuestions(ASSESSMENT_ID, PP_ASSIGNMENT_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when practice problem assignment does not exist', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(mockAssessment as never);
    prismaMock.lesson.findUnique.mockResolvedValue({ unit: { courseId: COURSE_ID } } as never);
    prismaMock.practiceProblemAssignment.findUnique.mockResolvedValue(null);

    await expect(
      assessmentService.importQuestions(ASSESSMENT_ID, PP_ASSIGNMENT_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws FORBIDDEN when PP assignment belongs to a different course', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(mockAssessment as never);
    prismaMock.lesson.findUnique.mockResolvedValue({ unit: { courseId: COURSE_ID } } as never);
    prismaMock.practiceProblemAssignment.findUnique.mockResolvedValue(
      makePPAssignment({
        assignment: {
          id: 'assign-1',
          lessonId: 'lesson-other',
          lesson: { id: 'lesson-other', unitId: 'unit-other', unit: { courseId: 'different-course' } },
        },
      }) as never,
    );

    await expect(
      assessmentService.importQuestions(ASSESSMENT_ID, PP_ASSIGNMENT_ID),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('returns empty array when PP assignment has no questions', async () => {
    prismaMock.assessment.findFirst.mockResolvedValue(mockAssessment as never);
    prismaMock.lesson.findUnique.mockResolvedValue({ unit: { courseId: COURSE_ID } } as never);
    prismaMock.practiceProblemAssignment.findUnique.mockResolvedValue(
      makePPAssignment({ questions: [] }) as never,
    );
    prismaMock.$transaction.mockResolvedValue([]);

    const result = await assessmentService.importQuestions(ASSESSMENT_ID, PP_ASSIGNMENT_ID);

    expect(result).toEqual([]);
  });

  it('creates questions with order starting after existing max order', async () => {
    const ppQuestion = {
      id: 'ppq-1',
      practiceProblemAssignmentId: PP_ASSIGNMENT_ID,
      order: 0,
      type: 'multiple_choice' as const,
      content: { question: 'What is 2+2?', options: ['3', '4'], correctIndex: 1 },
    };
    prismaMock.assessment.findFirst.mockResolvedValue(mockAssessment as never);
    prismaMock.lesson.findUnique.mockResolvedValue({ unit: { courseId: COURSE_ID } } as never);
    prismaMock.practiceProblemAssignment.findUnique.mockResolvedValue(
      makePPAssignment({ questions: [ppQuestion] }) as never,
    );
    // Existing assessment has questions up to order 2
    prismaMock.assessmentQuestion.aggregate.mockResolvedValue({ _max: { order: 2 } } as never);
    const createdQuestion = {
      id: 'new-q-1',
      assessmentId: ASSESSMENT_ID,
      type: 'multiple_choice',
      question: 'What is 2+2?',
      content: ppQuestion.content,
      order: 3,
      calculatorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.$transaction.mockResolvedValue([createdQuestion]);

    const result = await assessmentService.importQuestions(ASSESSMENT_ID, PP_ASSIGNMENT_ID);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ order: 3 });
  });

  it('extracts question text and calculatorEnabled from content', async () => {
    const ppQuestion = {
      id: 'ppq-1',
      practiceProblemAssignmentId: PP_ASSIGNMENT_ID,
      order: 0,
      type: 'multiple_choice' as const,
      content: { question: 'Extracted question?', options: ['A'], correctIndex: 0, calculatorEnabled: true },
    };
    prismaMock.assessment.findFirst.mockResolvedValue(mockAssessment as never);
    prismaMock.lesson.findUnique.mockResolvedValue({ unit: { courseId: COURSE_ID } } as never);
    prismaMock.practiceProblemAssignment.findUnique.mockResolvedValue(
      makePPAssignment({ questions: [ppQuestion] }) as never,
    );
    prismaMock.assessmentQuestion.aggregate.mockResolvedValue({ _max: { order: null } } as never);
    prismaMock.assessmentQuestion.create.mockResolvedValue({} as never);
    prismaMock.$transaction.mockImplementation(async (queries: unknown) => {
      return Promise.all((queries as Promise<unknown>[]));
    });

    await assessmentService.importQuestions(ASSESSMENT_ID, PP_ASSIGNMENT_ID);

    expect(prismaMock.assessmentQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          question: 'Extracted question?',
          calculatorEnabled: true,
          order: 0,
        }),
      }),
    );
  });
});
