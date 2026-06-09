import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Prisma, Course, User } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { courseService } from '../../services/course.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { AppError } from '../../errors/AppError.js';

const USER_ID = 'user-author';
const OTHER_USER_ID = 'user-other';
const ADMIN_ID = 'user-admin';
const COURSE_ID = 'course-1';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: COURSE_ID,
    title: 'Test Course',
    description: 'Test description',
    authorId: USER_ID,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

type CourseWithUnits = Prisma.CourseGetPayload<{
  include: { author: { select: { id: true; name: true } }; units: true };
}>;

// Simulated course with units (as returned by findFirst in findById)
const mockCourseWithUnits: CourseWithUnits = {
  ...makeCourse(),
  author: { id: USER_ID, name: 'Author' },
  units: [],
};

describe('courseService.findAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all non-soft-deleted courses', async () => {
    const courses = [
      { ...makeCourse(), author: { id: USER_ID, name: 'Author' }, _count: { units: 0 } },
    ];
    prismaMock.course.findMany.mockResolvedValue(courses);

    const result = await courseService.findAll();

    expect(prismaMock.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
      }),
    );
    expect(result).toEqual(courses);
  });

  it('orders courses by createdAt desc', async () => {
    prismaMock.course.findMany.mockResolvedValue([]);

    await courseService.findAll();

    expect(prismaMock.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });
});

describe('courseService.findById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns course when found', async () => {
    prismaMock.course.findFirst.mockResolvedValue(mockCourseWithUnits);

    const result = await courseService.findById(COURSE_ID);

    expect(result).toEqual(mockCourseWithUnits);
  });

  it('throws NotFoundError when course does not exist', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);

    await expect(courseService.findById(COURSE_ID)).rejects.toThrow(NotFoundError);
  });

  it('uses findFirst with deletedAt: null', async () => {
    prismaMock.course.findFirst.mockResolvedValue(mockCourseWithUnits);

    await courseService.findById(COURSE_ID);

    expect(prismaMock.course.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: COURSE_ID, deletedAt: null }),
      }),
    );
  });
});

describe('courseService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates course with authorId', async () => {
    const course = makeCourse();
    prismaMock.course.create.mockResolvedValue(course);

    const result = await courseService.create({ title: 'New Course', description: 'Test course description' }, USER_ID);

    expect(prismaMock.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: USER_ID }),
      }),
    );
    expect(result).toEqual(course);
  });
});

describe('courseService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.course.findFirst.mockResolvedValue(mockCourseWithUnits);
  });

  it('updates course when user is the owner', async () => {
    const updated = makeCourse({ title: 'Updated Title' });
    prismaMock.course.update.mockResolvedValue(updated);

    const result = await courseService.update(COURSE_ID, { title: 'Updated Title' }, USER_ID, 'teacher');

    expect(prismaMock.course.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: COURSE_ID } }),
    );
    expect(result).toEqual(updated);
  });

  it('admin can update any course', async () => {
    const updated = makeCourse({ title: 'Admin Updated' });
    prismaMock.course.update.mockResolvedValue(updated);

    const result = await courseService.update(COURSE_ID, { title: 'Admin Updated' }, ADMIN_ID, 'admin');

    expect(prismaMock.course.update).toHaveBeenCalled();
    expect(result).toEqual(updated);
  });

  it('throws FORBIDDEN when non-owner teacher tries to update', async () => {
    await expect(
      courseService.update(COURSE_ID, { title: 'Hack' }, OTHER_USER_ID, 'teacher'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('throws NotFoundError when course does not exist', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);

    await expect(
      courseService.update(COURSE_ID, { title: 'Updated' }, USER_ID, 'teacher'),
    ).rejects.toThrow(NotFoundError);
  });
});

describe('courseService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.course.findFirst.mockResolvedValue(mockCourseWithUnits);
    // Set up defaults for softDeleteCourse cascade
    prismaMock.assessment.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.unit.findMany.mockResolvedValue([]);
    prismaMock.course.update.mockResolvedValue(makeCourse({ deletedAt: new Date() }));
  });

  it('soft-deletes the course via transaction when owner removes', async () => {
    await courseService.remove(COURSE_ID, USER_ID, 'teacher');

    // softDeleteCourse calls course.update with deletedAt inside the transaction
    expect(prismaMock.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: COURSE_ID },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('admin can remove any course', async () => {
    await courseService.remove(COURSE_ID, ADMIN_ID, 'admin');

    expect(prismaMock.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: COURSE_ID },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('throws FORBIDDEN when non-owner teacher tries to remove', async () => {
    await expect(
      courseService.remove(COURSE_ID, OTHER_USER_ID, 'teacher'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('throws NotFoundError when course does not exist', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);

    await expect(courseService.remove(COURSE_ID, USER_ID, 'teacher')).rejects.toThrow(NotFoundError);
  });
});
