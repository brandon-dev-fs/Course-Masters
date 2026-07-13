import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/builder.service.js', () => ({
  builderService: {
    getOutline: vi.fn(),
    reorderUnits: vi.fn(),
    reorderLessons: vi.fn(),
  },
}));

import { builderController } from '../../controllers/builder.controller.js';
import { builderService } from '../../services/builder.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockGetOutline = builderService.getOutline as ReturnType<typeof vi.fn>;
const mockReorderUnits = builderService.reorderUnits as ReturnType<typeof vi.fn>;
const mockReorderLessons = builderService.reorderLessons as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('builderController.getOutline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the course outline', async () => {
    const outline = { id: 'c1', units: [] };
    mockGetOutline.mockResolvedValue(outline);
    const req = makeReq({ params: { courseId: 'c1' } });
    const { res, next } = await callHandler(builderController.getOutline, req);
    expect(mockGetOutline).toHaveBeenCalledWith('c1');
    expect(res.json).toHaveBeenCalledWith(outline);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('outline fail');
    mockGetOutline.mockRejectedValue(err);
    const req = makeReq({ params: { courseId: 'c1' } });
    const { next } = await callHandler(builderController.getOutline, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('builderController.reorderUnits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reorders units and responds with 204', async () => {
    mockReorderUnits.mockResolvedValue(undefined);
    const items = [{ id: 'u2', order: 1 }, { id: 'u1', order: 2 }];
    const req = makeReq({ params: { courseId: 'c1' }, body: { items } });
    const { res, next } = await callHandler(builderController.reorderUnits, req);
    expect(mockReorderUnits).toHaveBeenCalledWith('c1', items);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('reorder units fail');
    mockReorderUnits.mockRejectedValue(err);
    const req = makeReq({ params: { courseId: 'c1' }, body: { items: [] } });
    const { next } = await callHandler(builderController.reorderUnits, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('builderController.reorderLessons', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reorders lessons and responds with 204', async () => {
    mockReorderLessons.mockResolvedValue(undefined);
    const items = [{ id: 'l2', order: 1 }, { id: 'l1', order: 2 }];
    const req = makeReq({ params: { unitId: 'u1' }, body: { items } });
    const { res, next } = await callHandler(builderController.reorderLessons, req);
    expect(mockReorderLessons).toHaveBeenCalledWith('u1', items);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('reorder lessons fail');
    mockReorderLessons.mockRejectedValue(err);
    const req = makeReq({ params: { unitId: 'u1' }, body: { items: [] } });
    const { next } = await callHandler(builderController.reorderLessons, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
