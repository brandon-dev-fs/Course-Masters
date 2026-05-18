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
    const data = [{ resourceId: 'r1', completed: true }];
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

  it('toggles resource completion and responds with json', async () => {
    const data = { resourceId: 'r1', completed: true };
    mockToggle.mockResolvedValue(data);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { type: 'resource', targetId: 'r1' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(resourceCompletionController.toggleCompletion, req);
    expect(mockToggle).toHaveBeenCalledWith('l1', 'user1', 'resource', 'r1');
    expect(res.json).toHaveBeenCalledWith(data);
    expect(next).not.toHaveBeenCalled();
  });

  it('toggles tool completion and responds with json', async () => {
    const data = { toolId: 't1', completed: false };
    mockToggle.mockResolvedValue(data);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { type: 'tool', targetId: 't1' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(resourceCompletionController.toggleCompletion, req);
    expect(mockToggle).toHaveBeenCalledWith('l1', 'user1', 'tool', 't1');
    expect(res.json).toHaveBeenCalledWith(data);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('toggle fail');
    mockToggle.mockRejectedValue(err);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { type: 'resource', targetId: 'r1' },
      user: { id: 'user1', role: 'student' },
    });
    const { next } = await callHandler(resourceCompletionController.toggleCompletion, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
