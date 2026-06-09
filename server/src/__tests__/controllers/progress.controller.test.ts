import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/progress.service.js', () => ({
  progressService: {
    getCourseProgress: vi.fn(),
    getUnitProgress: vi.fn(),
  },
}));

import { progressController } from '../../controllers/progress.controller.js';
import { progressService } from '../../services/progress.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockGetCourseProgress = progressService.getCourseProgress as ReturnType<typeof vi.fn>;
const mockGetUnitProgress = progressService.getUnitProgress as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('progressController.getCourseProgress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns course progress', async () => {
    const progress = { percentage: 75, completedLessons: 3, totalLessons: 4 };
    mockGetCourseProgress.mockResolvedValue(progress);
    const req = makeReq({
      params: { courseId: 'c1' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(progressController.getCourseProgress, req);
    expect(mockGetCourseProgress).toHaveBeenCalledWith('c1', 'user1');
    expect(res.json).toHaveBeenCalledWith(progress);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('progress fail');
    mockGetCourseProgress.mockRejectedValue(err);
    const req = makeReq({ params: { courseId: 'c1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(progressController.getCourseProgress, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('progressController.getUnitProgress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns unit progress', async () => {
    const progress = { percentage: 50, completedLessons: 1, totalLessons: 2 };
    mockGetUnitProgress.mockResolvedValue(progress);
    const req = makeReq({
      params: { unitId: 'u1' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(progressController.getUnitProgress, req);
    expect(mockGetUnitProgress).toHaveBeenCalledWith('u1', 'user1');
    expect(res.json).toHaveBeenCalledWith(progress);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('unit progress fail');
    mockGetUnitProgress.mockRejectedValue(err);
    const req = makeReq({ params: { unitId: 'u1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(progressController.getUnitProgress, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
