import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/bookmark.service.js', () => ({
  bookmarkService: {
    getByAssignment: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    remove: vi.fn(),
  },
}));

import { bookmarkController } from '../../controllers/bookmark.controller.js';
import { bookmarkService } from '../../services/bookmark.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockGetByAssignment = bookmarkService.getByAssignment as ReturnType<typeof vi.fn>;
const mockCreate = bookmarkService.create as ReturnType<typeof vi.fn>;
const mockUpsert = bookmarkService.upsert as ReturnType<typeof vi.fn>;
const mockRemove = bookmarkService.remove as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('bookmarkController.getOne', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns bookmark for assignment', async () => {
    const bookmark = { id: 'bm1', assignmentId: 'a1', note: 'test' };
    mockGetByAssignment.mockResolvedValue(bookmark);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1' } });
    const { res, next } = await callHandler(bookmarkController.getOne, req);
    expect(mockGetByAssignment).toHaveBeenCalledWith('a1', 'user1');
    expect(res.json).toHaveBeenCalledWith(bookmark);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('not found');
    mockGetByAssignment.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1' } });
    const { next } = await callHandler(bookmarkController.getOne, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('bookmarkController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates bookmark and responds with 201', async () => {
    const created = { id: 'bm1', assignmentId: 'a1', note: 'new note' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({
      params: { assignmentId: 'a1' },
      user: { id: 'user1' },
      body: { note: 'new note' },
    });
    const { res, next } = await callHandler(bookmarkController.create, req);
    expect(mockCreate).toHaveBeenCalledWith('a1', 'user1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1' }, body: {} });
    const { next } = await callHandler(bookmarkController.create, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('bookmarkController.upsert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('upserts bookmark and responds with json', async () => {
    const upserted = { id: 'bm1', assignmentId: 'a1', note: 'updated' };
    mockUpsert.mockResolvedValue(upserted);
    const req = makeReq({
      params: { assignmentId: 'a1' },
      user: { id: 'user1' },
      body: { note: 'updated' },
    });
    const { res, next } = await callHandler(bookmarkController.upsert, req);
    expect(mockUpsert).toHaveBeenCalledWith('a1', 'user1', req.body);
    expect(res.json).toHaveBeenCalledWith(upserted);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('upsert fail');
    mockUpsert.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1' }, body: {} });
    const { next } = await callHandler(bookmarkController.upsert, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('bookmarkController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes bookmark and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1' } });
    const { res, next } = await callHandler(bookmarkController.remove, req);
    expect(mockRemove).toHaveBeenCalledWith('a1', 'user1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1' } });
    const { next } = await callHandler(bookmarkController.remove, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
