import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import { softDeleteUser } from '../utils/softDelete.js';

export const userService = {
  /**
   * Soft-delete a user and cascade soft-delete to all of their Courses,
   * Units, Lessons, and Assessments. Atomic — wrapped in a single transaction.
   * Throws NotFoundError if the user does not exist or is already soft-deleted.
   */
  async remove(userId: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundError('User not found');

    await prisma.$transaction(async tx => {
      await softDeleteUser(tx, userId);
    });
  },
};
