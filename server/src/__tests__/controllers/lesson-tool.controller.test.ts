import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/lesson-tool.service.js', () => ({
  lessonToolService: {
    findAllByLesson: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { lessonToolController } from '../../controllers/lesson-tool.controller.js';
import { lessonToolService } from '../../services/lesson-tool.service.js';
import { makeReq, makeNext } from '../mocks/express.js';
import { vi as vitest } from 'vitest';

const mockFindAll = lessonToolService.findAllByLesson as ReturnType<typeof vi.fn>;
const mockCreate = lessonToolService.create as ReturnType<typeof vi.fn>;
const mockUpdate = lessonToolService.update as ReturnType<typeof vi.fn>;
const mockRemove = lessonToolService.remove as ReturnType<typeof vi.fn>;

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

describe('lessonToolController.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns tools filtered by type from validatedQuery', async () => {
    const tools = [{ id: 't1', type: 'flash_card' }];
    mockFindAll.mockResolvedValue(tools);
    const { res, next } = await callHandler(
      lessonToolController.getAll,
      makeReq({ params: { lessonId: 'l1' } }),
      { validatedQuery: { type: 'flash_card' } },
    );
    expect(mockFindAll).toHaveBeenCalledWith('l1', 'flash_card');
    expect(res.json).toHaveBeenCalledWith(tools);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('fail');
    mockFindAll.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonToolController.getAll,
      makeReq({ params: { lessonId: 'l1' } }),
      { validatedQuery: {} },
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonToolController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates tool and responds with 201', async () => {
    const created = { id: 't2', type: 'vocab' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({ params: { lessonId: 'l1' }, body: { type: 'vocab', title: 'Word' } });
    const { res, next } = await callHandler(lessonToolController.create, req, {});
    expect(mockCreate).toHaveBeenCalledWith('l1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonToolController.create,
      makeReq({ params: { lessonId: 'l1' }, body: {} }),
      {},
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonToolController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates tool and responds with json', async () => {
    const updated = { id: 't1', title: 'Updated' };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({ params: { toolId: 't1' }, body: { title: 'Updated' } });
    const { res, next } = await callHandler(lessonToolController.update, req, {});
    expect(mockUpdate).toHaveBeenCalledWith('t1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonToolController.update,
      makeReq({ params: { toolId: 't1' }, body: {} }),
      {},
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('lessonToolController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes tool and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const { res, next } = await callHandler(
      lessonToolController.remove,
      makeReq({ params: { toolId: 't1' } }),
      {},
    );
    expect(mockRemove).toHaveBeenCalledWith('t1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const { next } = await callHandler(
      lessonToolController.remove,
      makeReq({ params: { toolId: 't1' } }),
      {},
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});
