import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/assessment.service.js', () => ({
  assessmentService: {
    findByParent: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    submitAttempt: vi.fn(),
    getAttempts: vi.fn(),
    bulkUpdateCalculator: vi.fn(),
    importQuestions: vi.fn(),
  },
}));

import { assessmentController, createAssessmentController } from '../../controllers/assessment.controller.js';
import { assessmentService } from '../../services/assessment.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockFindByParent = assessmentService.findByParent as ReturnType<typeof vi.fn>;
const mockCreate = assessmentService.create as ReturnType<typeof vi.fn>;
const mockUpdate = assessmentService.update as ReturnType<typeof vi.fn>;
const mockSubmitAttempt = assessmentService.submitAttempt as ReturnType<typeof vi.fn>;
const mockGetAttempts = assessmentService.getAttempts as ReturnType<typeof vi.fn>;
const mockBulkUpdateCalculator = assessmentService.bulkUpdateCalculator as ReturnType<typeof vi.fn>;
const mockImportQuestions = assessmentService.importQuestions as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('createAssessmentController — factory function', () => {
  const lessonController = createAssessmentController('lesson_quiz', 'lessonId');

  beforeEach(() => vi.clearAllMocks());

  it('get: returns assessment for parent', async () => {
    const assessment = { id: 'a1', type: 'lesson_quiz' };
    mockFindByParent.mockResolvedValue(assessment);
    const req = makeReq({
      params: { lessonId: 'l1' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(lessonController.get, req);
    expect(mockFindByParent).toHaveBeenCalledWith('lesson_quiz', 'l1', 'user1');
    expect(res.json).toHaveBeenCalledWith(assessment);
    expect(next).not.toHaveBeenCalled();
  });

  it('get: calls next with error on failure', async () => {
    const err = new Error('fail');
    mockFindByParent.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(lessonController.get, req);
    expect(next).toHaveBeenCalledWith(err);
  });

  it('create: creates assessment and responds with 201', async () => {
    const created = { id: 'a2', type: 'lesson_quiz' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { questions: [] },
      user: { id: 'user1', role: 'teacher' },
    });
    const { res, next } = await callHandler(lessonController.create, req);
    expect(mockCreate).toHaveBeenCalledWith('lesson_quiz', 'l1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('create: calls next with error on failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, body: {}, user: { id: 'user1', role: 'teacher' } });
    const { next } = await callHandler(lessonController.create, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assessmentController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates assessment and responds with json', async () => {
    const updated = { id: 'a1' };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({ params: { assessmentId: 'a1' }, body: { questions: [] } });
    const { res, next } = await callHandler(assessmentController.update, req);
    expect(mockUpdate).toHaveBeenCalledWith('a1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const { next } = await callHandler(
      assessmentController.update,
      makeReq({ params: { assessmentId: 'a1' }, body: {} }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assessmentController.submitAttempt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits attempt and responds with 201', async () => {
    const result = { id: 'attempt1', passed: true };
    mockSubmitAttempt.mockResolvedValue(result);
    const req = makeReq({
      params: { assessmentId: 'a1' },
      body: { answers: [] },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(assessmentController.submitAttempt, req);
    expect(mockSubmitAttempt).toHaveBeenCalledWith('a1', req.body, 'user1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(result);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('submit fail');
    mockSubmitAttempt.mockRejectedValue(err);
    const req = makeReq({
      params: { assessmentId: 'a1' },
      body: {},
      user: { id: 'user1', role: 'student' },
    });
    const { next } = await callHandler(assessmentController.submitAttempt, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assessmentController.getAttempts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns attempts with pagination defaults', async () => {
    const attempts = [{ id: 'att1' }];
    mockGetAttempts.mockResolvedValue(attempts);
    const req = makeReq({
      params: { assessmentId: 'a1' },
      query: {},
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(assessmentController.getAttempts, req);
    expect(mockGetAttempts).toHaveBeenCalledWith('a1', 'user1', 1, 20);
    expect(res.json).toHaveBeenCalledWith(attempts);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns attempts with custom pagination', async () => {
    const attempts = [{ id: 'att2' }];
    mockGetAttempts.mockResolvedValue(attempts);
    const req = makeReq({
      params: { assessmentId: 'a1' },
      query: { page: '2', pageSize: '10' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(assessmentController.getAttempts, req);
    expect(mockGetAttempts).toHaveBeenCalledWith('a1', 'user1', 2, 10);
    expect(res.json).toHaveBeenCalledWith(attempts);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with ValidationError for invalid page param', async () => {
    const req = makeReq({
      params: { assessmentId: 'a1' },
      query: { page: 'not-a-number', pageSize: '10' },
      user: { id: 'user1', role: 'student' },
    });
    const { next } = await callHandler(assessmentController.getAttempts, req);
    expect(next).toHaveBeenCalled();
    const calledWith = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(calledWith).toBeDefined();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('get attempts fail');
    mockGetAttempts.mockRejectedValue(err);
    const req = makeReq({
      params: { assessmentId: 'a1' },
      query: {},
      user: { id: 'user1', role: 'student' },
    });
    const { next } = await callHandler(assessmentController.getAttempts, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assessmentController.bulkUpdateCalculator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bulk updates calculator and responds with json', async () => {
    const result = { updated: 2 };
    mockBulkUpdateCalculator.mockResolvedValue(result);
    const req = makeReq({
      params: { assessmentId: 'a1' },
      body: { questionIds: ['q1', 'q2'], calculatorEnabled: true },
    });
    const { res, next } = await callHandler(assessmentController.bulkUpdateCalculator, req);
    expect(mockBulkUpdateCalculator).toHaveBeenCalledWith('a1', req.body);
    expect(res.json).toHaveBeenCalledWith(result);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('bulk fail');
    mockBulkUpdateCalculator.mockRejectedValue(err);
    const req = makeReq({ params: { assessmentId: 'a1' }, body: {} });
    const { next } = await callHandler(assessmentController.bulkUpdateCalculator, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assessmentController.importQuestions', () => {
  const PP_ID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => vi.clearAllMocks());

  it('imports questions and responds with 201', async () => {
    const questions = [{ id: 'q1', type: 'multiple_choice', question: 'Test?', order: 0 }];
    mockImportQuestions.mockResolvedValue(questions);
    const req = makeReq({
      params: { assessmentId: 'a1' },
      body: { practiceProblemAssignmentId: PP_ID },
      user: { id: 'teacher1', role: 'teacher' },
    });
    const { res, next } = await callHandler(assessmentController.importQuestions, req);
    expect(mockImportQuestions).toHaveBeenCalledWith('a1', PP_ID);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(questions);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('import fail');
    mockImportQuestions.mockRejectedValue(err);
    const req = makeReq({
      params: { assessmentId: 'a1' },
      body: { practiceProblemAssignmentId: PP_ID },
      user: { id: 'teacher1', role: 'teacher' },
    });
    const { next } = await callHandler(assessmentController.importQuestions, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
