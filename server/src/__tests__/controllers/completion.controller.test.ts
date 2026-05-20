import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/completion.service.js', () => ({
  completionService: {
    markLessonComplete: vi.fn(),
    removeLessonComplete: vi.fn(),
    markUnitComplete: vi.fn(),
    removeUnitComplete: vi.fn(),
  },
}));

import { completionController } from '../../controllers/completion.controller.js';
import { completionService } from '../../services/completion.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockMarkLesson = completionService.markLessonComplete as ReturnType<typeof vi.fn>;
const mockRemoveLesson = completionService.removeLessonComplete as ReturnType<typeof vi.fn>;
const mockMarkUnit = completionService.markUnitComplete as ReturnType<typeof vi.fn>;
const mockRemoveUnit = completionService.removeUnitComplete as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('completionController.markLessonComplete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks lesson complete and responds with 201', async () => {
    const data = { id: 'lc1', lessonId: 'l1', userId: 'user1' };
    mockMarkLesson.mockResolvedValue(data);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(completionController.markLessonComplete, req);
    expect(mockMarkLesson).toHaveBeenCalledWith('l1', 'user1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(data);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('fail');
    mockMarkLesson.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(completionController.markLessonComplete, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('completionController.removeLessonComplete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes lesson completion and responds with 204', async () => {
    mockRemoveLesson.mockResolvedValue(undefined);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(completionController.removeLessonComplete, req);
    expect(mockRemoveLesson).toHaveBeenCalledWith('l1', 'user1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('fail');
    mockRemoveLesson.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(completionController.removeLessonComplete, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('completionController.markUnitComplete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks unit complete and responds with 201', async () => {
    const data = { id: 'uc1', unitId: 'u1', userId: 'user1' };
    mockMarkUnit.mockResolvedValue(data);
    const req = makeReq({ params: { unitId: 'u1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(completionController.markUnitComplete, req);
    expect(mockMarkUnit).toHaveBeenCalledWith('u1', 'user1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(data);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('fail');
    mockMarkUnit.mockRejectedValue(err);
    const req = makeReq({ params: { unitId: 'u1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(completionController.markUnitComplete, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('completionController.removeUnitComplete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes unit completion and responds with 204', async () => {
    mockRemoveUnit.mockResolvedValue(undefined);
    const req = makeReq({ params: { unitId: 'u1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(completionController.removeUnitComplete, req);
    expect(mockRemoveUnit).toHaveBeenCalledWith('u1', 'user1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('fail');
    mockRemoveUnit.mockRejectedValue(err);
    const req = makeReq({ params: { unitId: 'u1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(completionController.removeUnitComplete, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
