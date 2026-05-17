import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/lesson-resource.service.js', () => ({
  lessonResourceService: {
    findAllByLesson: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { lessonResourceController } from '../../controllers/lesson-resource.controller.js';
import { lessonResourceService } from '../../services/lesson-resource.service.js';
import { makeReq, makeNext } from '../mocks/express.js';
import { vi as vitest } from 'vitest';

const mockFindAll = lessonResourceService.findAllByLesson as ReturnType<typeof vi.fn>;
const mockCreate = lessonResourceService.create as ReturnType<typeof vi.fn>;
const mockUpdate = lessonResourceService.update as ReturnType<typeof vi.fn>;
const mockRemove = lessonResourceService.remove as ReturnType<typeof vi.fn>;

function makeResWithLocals(locals: Record<string, unknown> = {}) {
  const res: Record<string, any> = {
    statusCode: 200,
    locals,
    status: vitest.fn(),
    json: vitest.fn(),
    send: vitest.fn(),
  };
  res.status = vitest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vitest.fn().mockReturnValue(res);
  res.send = vitest.fn().mockReturnValue(res);
  return res;
}

async function callHandler(
  handler: Function,
  req: ReturnType<typeof makeReq>,
  locals: Record<string, unknown> = {},
) {
  const res = makeResWithLocals(locals);
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('lessonResourceController.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns resources filtered by type from validatedQuery', async () => {
    const resources = [{ id: 'r1', type: 'note' }];
    mockFindAll.mockResolvedValue(resources);
    const { res, next } = await callHandler(
      lessonResourceController.getAll,
      makeReq({ params: { lessonId: 'l1' } }),
      { validatedQuery: { type: 'note' } },
    );
    expect(mockFindAll).toHaveBeenCalledWith('l1', 'note');
    expect(res.json).toHaveBeenCalledWith(resources);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('fail');
    mockFindAll.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonResourceController.getAll,
      makeReq({ params: { lessonId: 'l1' } }),
      { validatedQuery: {} },
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonResourceController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates resource and responds with 201', async () => {
    const created = { id: 'r2', type: 'note', title: 'Note' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({ params: { lessonId: 'l1' }, body: { type: 'note', title: 'Note' } });
    const { res, next } = await callHandler(lessonResourceController.create, req, {});
    expect(mockCreate).toHaveBeenCalledWith('l1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonResourceController.create,
      makeReq({ params: { lessonId: 'l1' }, body: {} }),
      {},
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonResourceController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates resource and responds with json', async () => {
    const updated = { id: 'r1', title: 'Updated' };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({ params: { resourceId: 'r1' }, body: { title: 'Updated' } });
    const { res, next } = await callHandler(lessonResourceController.update, req, {});
    expect(mockUpdate).toHaveBeenCalledWith('r1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonResourceController.update,
      makeReq({ params: { resourceId: 'r1' }, body: {} }),
      {},
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonResourceController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes resource and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const { res, next } = await callHandler(
      lessonResourceController.remove,
      makeReq({ params: { resourceId: 'r1' } }),
      {},
    );
    expect(mockRemove).toHaveBeenCalledWith('r1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonResourceController.remove,
      makeReq({ params: { resourceId: 'r1' } }),
      {},
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});
