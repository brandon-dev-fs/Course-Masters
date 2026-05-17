import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/lesson.service.js', () => ({
  lessonService: {
    findAllByUnit: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { lessonController } from '../../controllers/lesson.controller.js';
import { lessonService } from '../../services/lesson.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockFindAllByUnit = lessonService.findAllByUnit as ReturnType<typeof vi.fn>;
const mockFindById = lessonService.findById as ReturnType<typeof vi.fn>;
const mockCreate = lessonService.create as ReturnType<typeof vi.fn>;
const mockUpdate = lessonService.update as ReturnType<typeof vi.fn>;
const mockRemove = lessonService.remove as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('lessonController.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all lessons for a unit', async () => {
    const lessons = [{ id: 'l1', title: 'Lesson 1' }];
    mockFindAllByUnit.mockResolvedValue(lessons);
    const { res, next } = await callHandler(
      lessonController.getAll,
      makeReq({ params: { unitId: 'u1' } }),
    );
    expect(mockFindAllByUnit).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(lessons);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('fail');
    mockFindAllByUnit.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonController.getAll,
      makeReq({ params: { unitId: 'u1' } }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonController.getOne', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a lesson by id', async () => {
    const lesson = { id: 'l1', title: 'Lesson 1' };
    mockFindById.mockResolvedValue(lesson);
    const { res, next } = await callHandler(
      lessonController.getOne,
      makeReq({ params: { lessonId: 'l1' } }),
    );
    expect(mockFindById).toHaveBeenCalledWith('l1');
    expect(res.json).toHaveBeenCalledWith(lesson);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error when lesson not found', async () => {
    const err = new Error('not found');
    mockFindById.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonController.getOne,
      makeReq({ params: { lessonId: 'l1' } }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates lesson and responds with 201', async () => {
    const created = { id: 'l2', title: 'New Lesson' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({ params: { unitId: 'u1' }, body: { title: 'New Lesson' } });
    const { res, next } = await callHandler(lessonController.create, req);
    expect(mockCreate).toHaveBeenCalledWith('u1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonController.create,
      makeReq({ params: { unitId: 'u1' }, body: {} }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates lesson and responds with json', async () => {
    const updated = { id: 'l1', title: 'Updated' };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({ params: { lessonId: 'l1' }, body: { title: 'Updated' } });
    const { res, next } = await callHandler(lessonController.update, req);
    expect(mockUpdate).toHaveBeenCalledWith('l1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonController.update,
      makeReq({ params: { lessonId: 'l1' }, body: {} }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes lesson and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const { res, next } = await callHandler(
      lessonController.remove,
      makeReq({ params: { lessonId: 'l1' } }),
    );
    expect(mockRemove).toHaveBeenCalledWith('l1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonController.remove,
      makeReq({ params: { lessonId: 'l1' } }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});
