import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/user.service.js', () => ({
  userService: {
    getMe: vi.fn(),
    updatePreferences: vi.fn(),
    remove: vi.fn(),
  },
}));

import { userController } from '../../controllers/user.controller.js';
import { userService } from '../../services/user.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockGetMe = userService.getMe as ReturnType<typeof vi.fn>;
const mockUpdatePreferences = userService.updatePreferences as ReturnType<typeof vi.fn>;
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

describe('userController.getMe', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns user profile', async () => {
    const profile = { id: 'user1', name: 'Alice', email: 'alice@example.com' };
    mockGetMe.mockResolvedValue(profile);
    const req = makeReq({ user: { id: 'user1' } });
    const { res, next } = await callHandler(userController.getMe, req);
    expect(mockGetMe).toHaveBeenCalledWith('user1');
    expect(res.json).toHaveBeenCalledWith(profile);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('fetch fail');
    mockGetMe.mockRejectedValue(err);
    const req = makeReq({ user: { id: 'user1' } });
    const { next } = await callHandler(userController.getMe, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('userController.updatePreferences', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates preferences and responds with json', async () => {
    const updated = { id: 'user1', preferences: { theme: 'dark' } };
    mockUpdatePreferences.mockResolvedValue(updated);
    const req = makeReq({ user: { id: 'user1' }, body: { theme: 'dark' } });
    const { res, next } = await callHandler(userController.updatePreferences, req);
    expect(mockUpdatePreferences).toHaveBeenCalledWith('user1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdatePreferences.mockRejectedValue(err);
    const req = makeReq({ user: { id: 'user1' }, body: {} });
    const { next } = await callHandler(userController.updatePreferences, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

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
