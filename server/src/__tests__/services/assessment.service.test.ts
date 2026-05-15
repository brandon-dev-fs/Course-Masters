import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

// Import after vi.mock so the mock is in place
import { assessmentService } from '../../services/assessment.service.js';
import { AppError, NotFoundError } from '../../errors/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQuestion(
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: 'q-1',
    assessmentId: 'a-1',
    type: 'multiple_choice',
    order: 0,
    calculatorEnabled: false,
    content: {},
    ...overrides,
  };
}

function makeAssessment(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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
    // Default: no required resources or tools
    prismaMock.lessonResource.findMany.mockResolvedValue([]);
    prismaMock.lessonTool.findMany.mockResolvedValue([]);
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
  // Required assignments gate
  // -------------------------------------------------------------------------

  describe('required assignments gate', () => {
    it('throws REQUIRED_ASSIGNMENTS_INCOMPLETE when a required resource is not completed', async () => {
      const questions = [
        makeQuestion({ type: 'multiple_choice', content: { correctIndex: 0 } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(
        makeAssessment({ type: 'lesson_quiz', lessonId: 'lesson-1', questions }),
      );
      // One required resource exists
      prismaMock.lessonResource.findMany.mockResolvedValue([{ id: 'resource-1' }]);
      prismaMock.lessonTool.findMany.mockResolvedValue([]);
      // But the user has no completions
      prismaMock.lessonResourceCompletion.findMany.mockResolvedValue([]);
      prismaMock.lessonToolCompletion.findMany.mockResolvedValue([]);

      await expect(
        assessmentService.submitAttempt(ASSESSMENT_ID, { answers: [0] }, USER_ID),
      ).rejects.toMatchObject({
        code: 'REQUIRED_ASSIGNMENTS_INCOMPLETE',
        statusCode: 400,
      });
    });

    it('throws REQUIRED_ASSIGNMENTS_INCOMPLETE when a required tool is not completed', async () => {
      const questions = [
        makeQuestion({ type: 'multiple_choice', content: { correctIndex: 0 } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(
        makeAssessment({ type: 'lesson_quiz', lessonId: 'lesson-1', questions }),
      );
      // One required tool exists, no required resources
      prismaMock.lessonResource.findMany.mockResolvedValue([]);
      prismaMock.lessonTool.findMany.mockResolvedValue([{ id: 'tool-1' }]);
      // Tool not completed
      prismaMock.lessonResourceCompletion.findMany.mockResolvedValue([]);
      prismaMock.lessonToolCompletion.findMany.mockResolvedValue([]);

      await expect(
        assessmentService.submitAttempt(ASSESSMENT_ID, { answers: [0] }, USER_ID),
      ).rejects.toMatchObject({
        code: 'REQUIRED_ASSIGNMENTS_INCOMPLETE',
        statusCode: 400,
      });
    });

    it('allows submission when all required resources are completed', async () => {
      const questions = [
        makeQuestion({ type: 'multiple_choice', content: { correctIndex: 0 } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(
        makeAssessment({ type: 'lesson_quiz', lessonId: 'lesson-1', questions }),
      );
      // One required resource
      prismaMock.lessonResource.findMany.mockResolvedValue([{ id: 'resource-1' }]);
      prismaMock.lessonTool.findMany.mockResolvedValue([]);
      // Resource completed
      prismaMock.lessonResourceCompletion.findMany.mockResolvedValue([{ resourceId: 'resource-1' }]);
      prismaMock.lessonToolCompletion.findMany.mockResolvedValue([]);
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 1, passed: true, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [0] },
        USER_ID,
      );

      expect(result.correctCount).toBe(1);
    });

    it('skips required-assignment check for non-lesson_quiz assessment types', async () => {
      // unit_quiz should not check required resources
      const questions = [
        makeQuestion({ type: 'multiple_choice', content: { correctIndex: 0 } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(
        makeAssessment({ type: 'unit_quiz', lessonId: null, unitId: 'unit-1', questions }),
      );
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 1, passed: true, createdAt: new Date(),
      });

      // lessonResource/lessonTool findMany should NOT be called for unit_quiz
      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [0] },
        USER_ID,
      );

      expect(result.correctCount).toBe(1);
      expect(prismaMock.lessonResource.findMany).not.toHaveBeenCalled();
    });

    it('skips gate when there are no required resources or tools', async () => {
      // lesson_quiz but no required resources/tools
      const questions = [
        makeQuestion({ type: 'multiple_choice', content: { correctIndex: 0 } }),
      ];
      prismaMock.assessment.findFirst.mockResolvedValue(
        makeAssessment({ type: 'lesson_quiz', lessonId: 'lesson-1', questions }),
      );
      prismaMock.lessonResource.findMany.mockResolvedValue([]);
      prismaMock.lessonTool.findMany.mockResolvedValue([]);
      prismaMock.assessmentAttempt.create.mockResolvedValue({
        id: 'attempt-1', assessmentId: ASSESSMENT_ID, userId: USER_ID,
        score: 1, passed: true, createdAt: new Date(),
      });

      const result = await assessmentService.submitAttempt(
        ASSESSMENT_ID,
        { answers: [0] },
        USER_ID,
      );

      expect(result.correctCount).toBe(1);
      // Completions should not have been queried since allRequiredIds is empty
      expect(prismaMock.lessonResourceCompletion.findMany).not.toHaveBeenCalled();
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
