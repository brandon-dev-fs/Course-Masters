import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/unit.service.js', () => ({
  unitService: {
    findAllByCourse: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { unitController } from '../../controllers/unit.controller.js';
import { unitService } from '../../services/unit.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockFindAllByCourse = unitService.findAllByCourse as ReturnType<typeof vi.fn>;
const mockFindById = unitService.findById as ReturnType<typeof vi.fn>;
const mockCreate = unitService.create as ReturnType<typeof vi.fn>;
const mockUpdate = unitService.update as ReturnType<typeof vi.fn>;
const mockRemove = unitService.remove as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('unitController.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all units for a course', async () => {
    const units = [{ id: 'u1', title: 'Unit 1' }];
    mockFindAllByCourse.mockResolvedValue(units);
    const { res, next } = await callHandler(
      unitController.getAll,
      makeReq({ params: { courseId: 'c1' } }),
    );
    expect(mockFindAllByCourse).toHaveBeenCalledWith('c1');
    expect(res.json).toHaveBeenCalledWith(units);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('fail');
    mockFindAllByCourse.mockRejectedValue(err);
    const { next } = await callHandler(
      unitController.getAll,
      makeReq({ params: { courseId: 'c1' } }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('unitController.getOne', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a unit by id', async () => {
    const unit = { id: 'u1', title: 'Unit 1' };
    mockFindById.mockResolvedValue(unit);
    const { res, next } = await callHandler(
      unitController.getOne,
      makeReq({ params: { unitId: 'u1' } }),
    );
    expect(mockFindById).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(unit);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error when unit not found', async () => {
    const err = new Error('not found');
    mockFindById.mockRejectedValue(err);
    const { next } = await callHandler(
      unitController.getOne,
      makeReq({ params: { unitId: 'u1' } }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('unitController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates unit and responds with 201', async () => {
    const created = { id: 'u2', title: 'New Unit' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({ params: { courseId: 'c1' }, body: { title: 'New Unit' } });
    const { res, next } = await callHandler(unitController.create, req);
    expect(mockCreate).toHaveBeenCalledWith('c1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const { next } = await callHandler(
      unitController.create,
      makeReq({ params: { courseId: 'c1' }, body: {} }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('unitController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates unit and responds with json', async () => {
    const updated = { id: 'u1', title: 'Updated' };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({ params: { unitId: 'u1' }, body: { title: 'Updated' } });
    const { res, next } = await callHandler(unitController.update, req);
    expect(mockUpdate).toHaveBeenCalledWith('u1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const { next } = await callHandler(
      unitController.update,
      makeReq({ params: { unitId: 'u1' }, body: {} }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('unitController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes unit and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const { res, next } = await callHandler(
      unitController.remove,
      makeReq({ params: { unitId: 'u1' } }),
    );
    expect(mockRemove).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const { next } = await callHandler(
      unitController.remove,
      makeReq({ params: { unitId: 'u1' } }),
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});
