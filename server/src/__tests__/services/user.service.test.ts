import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { userService } from '../../services/user.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

const USER_ID = 'user-1';

const mockUser = {
  id: USER_ID,
  name: 'Test User',
  email: 'test@example.com',
  role: 'student',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('userService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up defaults for softDeleteUser cascade
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });
  });

  it('soft-deletes the user via transaction', async () => {
    prismaMock.user.findFirst.mockResolvedValue(mockUser);

    await userService.remove(USER_ID);

    // softDeleteUser calls user.update with deletedAt inside the transaction
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('throws NotFoundError when user does not exist', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(userService.remove(USER_ID)).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when user is already soft-deleted', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null); // findFirst with deletedAt: null returns null

    await expect(userService.remove(USER_ID)).rejects.toThrow(NotFoundError);
  });

  it('queries user with deletedAt: null to check existence', async () => {
    prismaMock.user.findFirst.mockResolvedValue(mockUser);

    await userService.remove(USER_ID);

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: USER_ID, deletedAt: null }),
      }),
    );
  });
});
