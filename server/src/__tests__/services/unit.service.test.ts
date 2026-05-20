import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Unit } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { unitService } from '../../services/unit.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

function makeUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: 'unit-1',
    courseId: 'course-1',
    title: 'Test Unit',
    description: null,
    order: 1,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const COURSE_ID = 'course-1';
const UNIT_ID = 'unit-1';

const mockCourse = { id: COURSE_ID, title: 'Course 1', deletedAt: null };
const mockUnitWithLessons = {
  ...makeUnit(),
  lessons: [],
};

describe('unitService.findAllByCourse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.course.findFirst.mockResolvedValue(mockCourse);
    prismaMock.unit.findMany.mockResolvedValue([]);
  });

  it('throws NotFoundError when course does not exist', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);

    await expect(unitService.findAllByCourse(COURSE_ID)).rejects.toThrow(NotFoundError);
  });

  it('returns units sorted by order', async () => {
    const units = [
      { ...makeUnit(), _count: { lessons: 0 } },
      { ...makeUnit({ id: 'unit-2', order: 2 }), _count: { lessons: 0 } },
    ];
    prismaMock.unit.findMany.mockResolvedValue(units);

    const result = await unitService.findAllByCourse(COURSE_ID);

    expect(prismaMock.unit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { order: 'asc' } }),
    );
    expect(result).toEqual(units);
  });

  it('filters out soft-deleted units', async () => {
    prismaMock.unit.findMany.mockResolvedValue([]);

    await unitService.findAllByCourse(COURSE_ID);

    expect(prismaMock.unit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });
});

describe('unitService.findById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unit when found', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(mockUnitWithLessons);

    const result = await unitService.findById(UNIT_ID);

    expect(result).toEqual(mockUnitWithLessons);
  });

  it('throws NotFoundError when unit does not exist', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(null);

    await expect(unitService.findById(UNIT_ID)).rejects.toThrow(NotFoundError);
  });

  it('uses findFirst with deletedAt: null', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(mockUnitWithLessons);

    await unitService.findById(UNIT_ID);

    expect(prismaMock.unit.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: UNIT_ID, deletedAt: null }),
      }),
    );
  });
});

describe('unitService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.course.findFirst.mockResolvedValue(mockCourse);
  });

  it('creates unit with the provided courseId', async () => {
    const unit = makeUnit();
    prismaMock.unit.create.mockResolvedValue(unit);

    const result = await unitService.create(COURSE_ID, { title: 'New Unit', order: 1 });

    expect(prismaMock.unit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ courseId: COURSE_ID }),
      }),
    );
    expect(result).toEqual(unit);
  });

  it('throws NotFoundError when course does not exist', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);

    await expect(unitService.create(COURSE_ID, { title: 'New Unit', order: 1 })).rejects.toThrow(NotFoundError);
  });
});

describe('unitService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.unit.findFirst.mockResolvedValue(mockUnitWithLessons);
  });

  it('updates unit and returns updated record', async () => {
    const updated = makeUnit({ title: 'Updated Title' });
    prismaMock.unit.update.mockResolvedValue(updated);

    const result = await unitService.update(UNIT_ID, { title: 'Updated Title' });

    expect(prismaMock.unit.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: UNIT_ID } }),
    );
    expect(result).toEqual(updated);
  });

  it('throws NotFoundError when unit does not exist', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(null);

    await expect(unitService.update(UNIT_ID, { title: 'Updated' })).rejects.toThrow(NotFoundError);
  });
});

describe('unitService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.unit.findFirst.mockResolvedValue(mockUnitWithLessons);
    // softDeleteUnit cascade: tx === prismaMock after mock fix
    prismaMock.assessment.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.lesson.findMany.mockResolvedValue([]);
    prismaMock.unit.update.mockResolvedValue({ ...mockUnitWithLessons, deletedAt: new Date() });
  });

  it('soft-deletes the unit via transaction when it exists', async () => {
    await expect(unitService.remove(UNIT_ID)).resolves.toBeUndefined();

    expect(prismaMock.unit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: UNIT_ID },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('throws NotFoundError when unit does not exist', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(null);

    await expect(unitService.remove(UNIT_ID)).rejects.toThrow(NotFoundError);
  });
});
