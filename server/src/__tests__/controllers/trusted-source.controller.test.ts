import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/trusted-source.service.js', () => ({
  trustedSourceService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  },
}));

import { trustedSourceController } from '../../controllers/trusted-source.controller.js';
import { trustedSourceService } from '../../services/trusted-source.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockList = trustedSourceService.list as ReturnType<typeof vi.fn>;
const mockCreate = trustedSourceService.create as ReturnType<typeof vi.fn>;
const mockUpdate = trustedSourceService.update as ReturnType<typeof vi.fn>;
const mockDeactivate = trustedSourceService.deactivate as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

const SOURCE_ID = 'source-1';

function makeSource(overrides: Record<string, unknown> = {}) {
  return {
    id: SOURCE_ID,
    name: 'Khan Academy',
    domain: 'khanacademy.org',
    contentTypes: ['video'],
    categories: ['math'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe('trustedSourceController.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds with list of sources', async () => {
    const sources = [makeSource()];
    mockList.mockResolvedValue(sources);
    const req = makeReq();
    req.res = { locals: { validatedQuery: { active: 'true' } } } as any;

    // Simulate validatedQuery via res.locals
    const res = makeRes();
    (res as any).locals = { validatedQuery: { active: 'true' } };
    const next = makeNext();
    trustedSourceController.list(req, res as any, next);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockList).toHaveBeenCalledWith({ active: 'true' });
    expect(res.json).toHaveBeenCalledWith(sources);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('db error');
    mockList.mockRejectedValue(err);
    const req = makeReq();
    const res = makeRes();
    (res as any).locals = { validatedQuery: {} };
    const next = makeNext();

    trustedSourceController.list(req, res as any, next);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('trustedSourceController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds 201 with the created source', async () => {
    const source = makeSource();
    mockCreate.mockResolvedValue(source);
    const req = makeReq({
      body: {
        name: 'Khan Academy',
        domain: 'khanacademy.org',
        contentTypes: ['video'],
        categories: ['math'],
        active: true,
      },
    });

    const { res, next } = await callHandler(trustedSourceController.create, req);

    expect(mockCreate).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(source);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);

    const { next } = await callHandler(
      trustedSourceController.create,
      makeReq({ body: { name: 'x' } }),
    );

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('trustedSourceController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds with the updated source', async () => {
    const updated = makeSource({ name: 'Updated Name' });
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({
      params: { sourceId: SOURCE_ID },
      body: { name: 'Updated Name' },
    });

    const { res, next } = await callHandler(trustedSourceController.update, req);

    expect(mockUpdate).toHaveBeenCalledWith(SOURCE_ID, req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('not found');
    mockUpdate.mockRejectedValue(err);

    const { next } = await callHandler(
      trustedSourceController.update,
      makeReq({ params: { sourceId: SOURCE_ID }, body: { name: 'x' } }),
    );

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// deactivate
// ---------------------------------------------------------------------------

describe('trustedSourceController.deactivate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds 204 on success', async () => {
    mockDeactivate.mockResolvedValue(undefined);
    const req = makeReq({ params: { sourceId: SOURCE_ID } });

    const { res, next } = await callHandler(trustedSourceController.deactivate, req);

    expect(mockDeactivate).toHaveBeenCalledWith(SOURCE_ID);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('deactivate fail');
    mockDeactivate.mockRejectedValue(err);

    const { next } = await callHandler(
      trustedSourceController.deactivate,
      makeReq({ params: { sourceId: SOURCE_ID } }),
    );

    expect(next).toHaveBeenCalledWith(err);
  });
});
