import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/course.service.js', () => ({
  courseService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { courseController } from '../../controllers/course.controller.js';
import { courseService } from '../../services/course.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockFindAll = courseService.findAll as ReturnType<typeof vi.fn>;
const mockFindById = courseService.findById as ReturnType<typeof vi.fn>;
const mockCreate = courseService.create as ReturnType<typeof vi.fn>;
const mockUpdate = courseService.update as ReturnType<typeof vi.fn>;
const mockRemove = courseService.remove as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('courseController.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all courses via res.json', async () => {
    mockFindAll.mockResolvedValue([{ id: 'c1', title: 'Course' }]);
    const { res, next } = await callHandler(courseController.getAll, makeReq());
    expect(res.json).toHaveBeenCalledWith([{ id: 'c1', title: 'Course' }]);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('db fail');
    mockFindAll.mockRejectedValue(err);
    const { next } = await callHandler(courseController.getAll, makeReq());
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('courseController.getOne', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns course by id', async () => {
    const course = { id: 'c1', title: 'Course' };
    mockFindById.mockResolvedValue(course);
    const { res, next } = await callHandler(
      courseController.getOne,
      makeReq({ params: { courseId: 'c1' } }),
    );
    expect(mockFindById).toHaveBeenCalledWith('c1');
    expect(res.json).toHaveBeenCalledWith(course);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error when course not found', async () => {
    const err = new Error('not found');
    mockFindById.mockRejectedValue(err);
    const { next } = await callHandler(
      courseController.getOne,
      makeReq({ params: { courseId: 'c1' } }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('courseController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates course and responds with 201', async () => {
    const created = { id: 'c2', title: 'New Course' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({
      body: { title: 'New Course', description: 'Desc' },
      user: { id: 'user1', role: 'teacher' },
    });
    const { res, next } = await callHandler(courseController.create, req);
    expect(mockCreate).toHaveBeenCalledWith(req.body, 'user1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const req = makeReq({
      body: { title: 'New Course' },
      user: { id: 'user1', role: 'teacher' },
    });
    const { next } = await callHandler(courseController.create, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('courseController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates course and responds with json', async () => {
    const updated = { id: 'c1', title: 'Updated' };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({
      params: { courseId: 'c1' },
      body: { title: 'Updated' },
      user: { id: 'user1', role: 'teacher' },
    });
    const { res, next } = await callHandler(courseController.update, req);
    expect(mockUpdate).toHaveBeenCalledWith('c1', req.body, 'user1', 'teacher');
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const req = makeReq({
      params: { courseId: 'c1' },
      body: {},
      user: { id: 'user1', role: 'teacher' },
    });
    const { next } = await callHandler(courseController.update, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('courseController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes course and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const req = makeReq({
      params: { courseId: 'c1' },
      user: { id: 'user1', role: 'teacher' },
    });
    const { res, next } = await callHandler(courseController.remove, req);
    expect(mockRemove).toHaveBeenCalledWith('c1', 'user1', 'teacher');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const req = makeReq({
      params: { courseId: 'c1' },
      user: { id: 'user1', role: 'teacher' },
    });
    const { next } = await callHandler(courseController.remove, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
