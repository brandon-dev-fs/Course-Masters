import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import { softDeleteUser } from '../utils/softDelete.js';
import type { UpdatePreferencesInput } from '../schemas/user.schema.js';

export const userService = {
  /**
   * Returns the authenticated user's profile data.
   * Throws NotFoundError if the user record is not found (defensive).
   */
  async getMe(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        themePreference: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  /**
   * Updates the authenticated user's theme preference.
   * Returns the updated themePreference value.
   */
  async updatePreferences(userId: string, data: UpdatePreferencesInput) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundError('User not found');
    return prisma.user.update({
      where: { id: userId },
      data: { themePreference: data.themePreference },
      select: { themePreference: true },
    });
  },

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
