import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/assignment.service.js', () => ({
  assignmentService: {
    findAllByLesson: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
    markComplete: vi.fn(),
    markIncomplete: vi.fn(),
  },
}));

import { assignmentController } from '../../controllers/assignment.controller.js';
import { assignmentService } from '../../services/assignment.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockFindAll = assignmentService.findAllByLesson as ReturnType<typeof vi.fn>;
const mockFindById = assignmentService.findById as ReturnType<typeof vi.fn>;
const mockCreate = assignmentService.create as ReturnType<typeof vi.fn>;
const mockUpdate = assignmentService.update as ReturnType<typeof vi.fn>;
const mockRemove = assignmentService.remove as ReturnType<typeof vi.fn>;
const mockReorder = assignmentService.reorder as ReturnType<typeof vi.fn>;
const mockMarkComplete = assignmentService.markComplete as ReturnType<typeof vi.fn>;
const mockMarkIncomplete = assignmentService.markIncomplete as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('assignmentController.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all assignments for a lesson', async () => {
    const assignments = [{ id: 'a1', title: 'Assignment 1' }];
    mockFindAll.mockResolvedValue(assignments);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.getAll, req);
    expect(mockFindAll).toHaveBeenCalledWith('l1', 'user1');
    expect(res.json).toHaveBeenCalledWith(assignments);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('fail');
    mockFindAll.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.getAll, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.getOne', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns one assignment by id', async () => {
    const assignment = { id: 'a1', title: 'Assignment 1' };
    mockFindById.mockResolvedValue(assignment);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.getOne, req);
    expect(mockFindById).toHaveBeenCalledWith('a1', 'user1');
    expect(res.json).toHaveBeenCalledWith(assignment);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('not found');
    mockFindById.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.getOne, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates assignment and responds with 201', async () => {
    const created = { id: 'a2', title: 'New Assignment' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({ params: { lessonId: 'l1' }, body: { type: 'note', title: 'New Assignment' } });
    const { res, next } = await callHandler(assignmentController.create, req);
    expect(mockCreate).toHaveBeenCalledWith('l1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, body: {} });
    const { next } = await callHandler(assignmentController.create, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates assignment and responds with json', async () => {
    const updated = { id: 'a1', title: 'Updated' };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({ params: { assignmentId: 'a1' }, body: { title: 'Updated' } });
    const { res, next } = await callHandler(assignmentController.update, req);
    expect(mockUpdate).toHaveBeenCalledWith('a1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, body: {} });
    const { next } = await callHandler(assignmentController.update, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes assignment and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const req = makeReq({ params: { assignmentId: 'a1' } });
    const { res, next } = await callHandler(assignmentController.remove, req);
    expect(mockRemove).toHaveBeenCalledWith('a1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' } });
    const { next } = await callHandler(assignmentController.remove, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.reorder', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reorders assignments and responds with json', async () => {
    const reordered = [{ id: 'a2' }, { id: 'a1' }];
    mockReorder.mockResolvedValue(reordered);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { assignmentIds: ['a2', 'a1'] },
    });
    const { res, next } = await callHandler(assignmentController.reorder, req);
    expect(mockReorder).toHaveBeenCalledWith('l1', ['a2', 'a1']);
    expect(res.json).toHaveBeenCalledWith(reordered);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('reorder fail');
    mockReorder.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, body: { assignmentIds: [] } });
    const { next } = await callHandler(assignmentController.reorder, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.complete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks assignment complete and responds with 201', async () => {
    const completion = { id: 'comp1', assignmentId: 'a1' };
    mockMarkComplete.mockResolvedValue(completion);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.complete, req);
    expect(mockMarkComplete).toHaveBeenCalledWith('a1', 'user1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(completion);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('complete fail');
    mockMarkComplete.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.complete, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.uncomplete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks assignment incomplete and responds with 204', async () => {
    mockMarkIncomplete.mockResolvedValue(undefined);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.uncomplete, req);
    expect(mockMarkIncomplete).toHaveBeenCalledWith('a1', 'user1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('uncomplete fail');
    mockMarkIncomplete.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.uncomplete, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
