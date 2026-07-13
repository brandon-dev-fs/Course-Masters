import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/checklist.service.js', () => ({
  checklistService: {
    findAllByLesson: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
  },
}));

import { checklistController } from '../../controllers/checklist.controller.js';
import { checklistService } from '../../services/checklist.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockFindAll = checklistService.findAllByLesson as ReturnType<typeof vi.fn>;
const mockCreate = checklistService.create as ReturnType<typeof vi.fn>;
const mockUpdate = checklistService.update as ReturnType<typeof vi.fn>;
const mockRemove = checklistService.remove as ReturnType<typeof vi.fn>;
const mockReorder = checklistService.reorder as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('checklistController.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all checklist items for a lesson', async () => {
    const items = [{ id: 'ci1', text: 'Item 1', completed: false }];
    mockFindAll.mockResolvedValue(items);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1' } });
    const { res, next } = await callHandler(checklistController.getAll, req);
    expect(mockFindAll).toHaveBeenCalledWith('l1', 'user1');
    expect(res.json).toHaveBeenCalledWith(items);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('fetch fail');
    mockFindAll.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1' } });
    const { next } = await callHandler(checklistController.getAll, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('checklistController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates checklist item and responds with 201', async () => {
    const created = { id: 'ci1', text: 'New item', completed: false };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({
      params: { lessonId: 'l1' },
      user: { id: 'user1' },
      body: { text: 'New item' },
    });
    const { res, next } = await callHandler(checklistController.create, req);
    expect(mockCreate).toHaveBeenCalledWith('l1', 'user1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1' }, body: {} });
    const { next } = await callHandler(checklistController.create, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('checklistController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates checklist item and responds with json', async () => {
    const updated = { id: 'ci1', text: 'Updated', completed: true };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({
      params: { itemId: 'ci1' },
      user: { id: 'user1' },
      body: { completed: true },
    });
    const { res, next } = await callHandler(checklistController.update, req);
    expect(mockUpdate).toHaveBeenCalledWith('ci1', 'user1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const req = makeReq({ params: { itemId: 'ci1' }, user: { id: 'user1' }, body: {} });
    const { next } = await callHandler(checklistController.update, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('checklistController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes checklist item and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const req = makeReq({ params: { itemId: 'ci1' }, user: { id: 'user1' } });
    const { res, next } = await callHandler(checklistController.remove, req);
    expect(mockRemove).toHaveBeenCalledWith('ci1', 'user1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const req = makeReq({ params: { itemId: 'ci1' }, user: { id: 'user1' } });
    const { next } = await callHandler(checklistController.remove, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('checklistController.reorder', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reorders checklist items and responds with json', async () => {
    const reordered = [{ id: 'ci2' }, { id: 'ci1' }];
    mockReorder.mockResolvedValue(reordered);
    const itemIds = ['ci2', 'ci1'];
    const req = makeReq({
      params: { lessonId: 'l1' },
      user: { id: 'user1' },
      body: { itemIds },
    });
    const { res, next } = await callHandler(checklistController.reorder, req);
    expect(mockReorder).toHaveBeenCalledWith('l1', 'user1', itemIds);
    expect(res.json).toHaveBeenCalledWith(reordered);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('reorder fail');
    mockReorder.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1' }, body: { itemIds: [] } });
    const { next } = await callHandler(checklistController.reorder, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
