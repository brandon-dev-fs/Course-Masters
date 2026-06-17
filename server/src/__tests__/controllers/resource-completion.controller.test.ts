import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/resource-completion.service.js', () => ({
  resourceCompletionService: {
    getByLesson: vi.fn(),
    toggle: vi.fn(),
  },
}));

import { resourceCompletionController } from '../../controllers/resource-completion.controller.js';
import { resourceCompletionService } from '../../services/resource-completion.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockGetByLesson = resourceCompletionService.getByLesson as ReturnType<typeof vi.fn>;
const mockToggle = resourceCompletionService.toggle as ReturnType<typeof vi.fn>;

const ASSIGNMENT_ID = '550e8400-e29b-41d4-a716-446655440000';

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('resourceCompletionController.getCompletions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns completions for the lesson and user', async () => {
    const data = { completions: [{ assignmentId: ASSIGNMENT_ID, completedAt: new Date() }] };
    mockGetByLesson.mockResolvedValue(data);
    const req = makeReq({
      params: { lessonId: 'l1' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(resourceCompletionController.getCompletions, req);
    expect(mockGetByLesson).toHaveBeenCalledWith('l1', 'user1');
    expect(res.json).toHaveBeenCalledWith(data);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('fail');
    mockGetByLesson.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(resourceCompletionController.getCompletions, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('resourceCompletionController.toggleCompletion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toggles assignment completion and responds with json', async () => {
    const data = { completions: [] };
    mockToggle.mockResolvedValue(data);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { assignmentId: ASSIGNMENT_ID },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(resourceCompletionController.toggleCompletion, req);
    expect(mockToggle).toHaveBeenCalledWith('l1', 'user1', ASSIGNMENT_ID);
    expect(res.json).toHaveBeenCalledWith(data);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('toggle fail');
    mockToggle.mockRejectedValue(err);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { assignmentId: ASSIGNMENT_ID },
      user: { id: 'user1', role: 'student' },
    });
    const { next } = await callHandler(resourceCompletionController.toggleCompletion, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
