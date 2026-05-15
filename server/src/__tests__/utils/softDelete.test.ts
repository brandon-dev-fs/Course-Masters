import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import {
  softDeleteLesson,
  softDeleteUnit,
  softDeleteCourse,
  softDeleteUser,
} from '../../utils/softDelete.js';

describe('softDeleteLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assessment.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.lesson.update.mockResolvedValue({ id: 'lesson-1' });
  });

  it('soft-deletes assessment for the lesson', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: { update: vi.fn().mockResolvedValue({ id: 'lesson-1' }) },
    };

    await softDeleteLesson(tx as Parameters<typeof softDeleteLesson>[0], 'lesson-1');

    expect(tx.assessment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ lessonId: 'lesson-1', deletedAt: null }),
      }),
    );
  });

  it('soft-deletes the lesson itself', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: { update: vi.fn().mockResolvedValue({ id: 'lesson-1' }) },
    };

    await softDeleteLesson(tx as Parameters<typeof softDeleteLesson>[0], 'lesson-1');

    expect(tx.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lesson-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('calls assessment.updateMany before lesson.update', async () => {
    const callOrder: string[] = [];
    const tx = {
      assessment: {
        updateMany: vi.fn().mockImplementation(() => {
          callOrder.push('assessment.updateMany');
          return Promise.resolve({ count: 0 });
        }),
      },
      lesson: {
        update: vi.fn().mockImplementation(() => {
          callOrder.push('lesson.update');
          return Promise.resolve({ id: 'lesson-1' });
        }),
      },
    };

    await softDeleteLesson(tx as Parameters<typeof softDeleteLesson>[0], 'lesson-1');

    expect(callOrder).toEqual(['assessment.updateMany', 'lesson.update']);
  });
});

describe('softDeleteUnit', () => {
  it('soft-deletes unit-level assessment', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      unit: { update: vi.fn().mockResolvedValue({ id: 'unit-1' }) },
    };

    await softDeleteUnit(tx as Parameters<typeof softDeleteUnit>[0], 'unit-1');

    expect(tx.assessment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ unitId: 'unit-1', deletedAt: null }),
      }),
    );
  });

  it('cascades to lessons when lessons exist', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: {
        findMany: vi.fn().mockResolvedValue([{ id: 'lesson-1' }, { id: 'lesson-2' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      unit: { update: vi.fn().mockResolvedValue({ id: 'unit-1' }) },
    };

    await softDeleteUnit(tx as Parameters<typeof softDeleteUnit>[0], 'unit-1');

    expect(tx.lesson.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['lesson-1', 'lesson-2'] } },
      }),
    );
  });

  it('soft-deletes lesson-level assessments when lessons exist', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: {
        findMany: vi.fn().mockResolvedValue([{ id: 'lesson-1' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      unit: { update: vi.fn().mockResolvedValue({ id: 'unit-1' }) },
    };

    await softDeleteUnit(tx as Parameters<typeof softDeleteUnit>[0], 'unit-1');

    // assessment.updateMany should be called twice: once for unit-level, once for lesson-level
    expect(tx.assessment.updateMany).toHaveBeenCalledTimes(2);
  });

  it('soft-deletes the unit itself', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      unit: { update: vi.fn().mockResolvedValue({ id: 'unit-1' }) },
    };

    await softDeleteUnit(tx as Parameters<typeof softDeleteUnit>[0], 'unit-1');

    expect(tx.unit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'unit-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('does not call lesson.updateMany when no lessons exist', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      unit: { update: vi.fn().mockResolvedValue({ id: 'unit-1' }) },
    };

    await softDeleteUnit(tx as Parameters<typeof softDeleteUnit>[0], 'unit-1');

    expect(tx.lesson.updateMany).not.toHaveBeenCalled();
  });
});

describe('softDeleteCourse', () => {
  it('soft-deletes the course-level assessment', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      unit: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      course: { update: vi.fn().mockResolvedValue({ id: 'course-1' }) },
    };

    await softDeleteCourse(tx as Parameters<typeof softDeleteCourse>[0], 'course-1');

    expect(tx.assessment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ courseId: 'course-1', deletedAt: null }),
      }),
    );
  });

  it('cascades through units and lessons when they exist', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      unit: {
        findMany: vi.fn().mockResolvedValue([{ id: 'unit-1' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      lesson: {
        findMany: vi.fn().mockResolvedValue([{ id: 'lesson-1' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      course: { update: vi.fn().mockResolvedValue({ id: 'course-1' }) },
    };

    await softDeleteCourse(tx as Parameters<typeof softDeleteCourse>[0], 'course-1');

    expect(tx.unit.updateMany).toHaveBeenCalled();
    expect(tx.lesson.updateMany).toHaveBeenCalled();
  });

  it('soft-deletes the course itself', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      unit: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      course: { update: vi.fn().mockResolvedValue({ id: 'course-1' }) },
    };

    await softDeleteCourse(tx as Parameters<typeof softDeleteCourse>[0], 'course-1');

    expect(tx.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'course-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('does not cascade to units when none exist', async () => {
    const tx = {
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      unit: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      lesson: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      course: { update: vi.fn().mockResolvedValue({ id: 'course-1' }) },
    };

    await softDeleteCourse(tx as Parameters<typeof softDeleteCourse>[0], 'course-1');

    expect(tx.unit.updateMany).not.toHaveBeenCalled();
    expect(tx.lesson.updateMany).not.toHaveBeenCalled();
  });
});

describe('softDeleteUser', () => {
  it('soft-deletes the user itself', async () => {
    const tx = {
      course: { findMany: vi.fn().mockResolvedValue([]) },
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      unit: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      user: { update: vi.fn().mockResolvedValue({ id: 'user-1' }) },
    };

    await softDeleteUser(tx as Parameters<typeof softDeleteUser>[0], 'user-1');

    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('cascades to user courses when they exist', async () => {
    const tx = {
      course: {
        findMany: vi.fn().mockResolvedValue([{ id: 'course-1' }]),
        update: vi.fn().mockResolvedValue({ id: 'course-1' }),
      },
      assessment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      unit: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      lesson: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      user: { update: vi.fn().mockResolvedValue({ id: 'user-1' }) },
    };

    await softDeleteUser(tx as Parameters<typeof softDeleteUser>[0], 'user-1');

    expect(tx.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ authorId: 'user-1', deletedAt: null }),
      }),
    );
    // course.update is called by softDeleteCourse
    expect(tx.course.update).toHaveBeenCalled();
  });

  it('does not call course soft-delete when user has no courses', async () => {
    const tx = {
      course: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      user: { update: vi.fn().mockResolvedValue({ id: 'user-1' }) },
    };

    await softDeleteUser(tx as Parameters<typeof softDeleteUser>[0], 'user-1');

    expect(tx.course.update).not.toHaveBeenCalled();
  });
});
