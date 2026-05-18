import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/user.service.js', () => ({
  userService: {
    remove: vi.fn(),
  },
}));

import { userController } from '../../controllers/user.controller.js';
import { userService } from '../../services/user.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockRemove = userService.remove as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('userController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes user and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const req = makeReq({ params: { userId: 'user1' } });
    const { res, next } = await callHandler(userController.remove, req);
    expect(mockRemove).toHaveBeenCalledWith('user1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const req = makeReq({ params: { userId: 'user1' } });
    const { next } = await callHandler(userController.remove, req);
    expect(next).toHaveBeenCalledWith(err);
  });

  it('passes correct userId from params', async () => {
    mockRemove.mockResolvedValue(undefined);
    const req = makeReq({ params: { userId: 'specific-user-id-123' } });
    await callHandler(userController.remove, req);
    expect(mockRemove).toHaveBeenCalledWith('specific-user-id-123');
  });
});
