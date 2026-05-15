import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LessonResource } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { lessonResourceService } from '../../services/lesson-resource.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

function makeResource(overrides: Partial<LessonResource> = {}): LessonResource {
  return {
    id: 'resource-1',
    lessonId: 'lesson-1',
    type: 'note',
    title: 'Test Resource',
    content: {},
    order: 1,
    isRequired: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const LESSON_ID = 'lesson-1';
const RESOURCE_ID = 'resource-1';
const mockLesson = { id: LESSON_ID, title: 'Lesson 1' };

describe('lessonResourceService.findAllByLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all resources sorted by order', async () => {
    const resources = [
      makeResource({ order: 1 }),
      makeResource({ id: 'resource-2', order: 2 }),
    ];
    prismaMock.lessonResource.findMany.mockResolvedValue(resources);

    const result = await lessonResourceService.findAllByLesson(LESSON_ID);

    expect(prismaMock.lessonResource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { order: 'asc' } }),
    );
    expect(result).toEqual(resources);
  });

  it('filters by type when type is provided', async () => {
    prismaMock.lessonResource.findMany.mockResolvedValue([makeResource({ type: 'note' })]);

    await lessonResourceService.findAllByLesson(LESSON_ID, 'note');

    expect(prismaMock.lessonResource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lessonId: LESSON_ID, type: 'note' } }),
    );
  });

  it('does not filter by type when type is not provided', async () => {
    prismaMock.lessonResource.findMany.mockResolvedValue([]);

    await lessonResourceService.findAllByLesson(LESSON_ID);

    expect(prismaMock.lessonResource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lessonId: LESSON_ID } }),
    );
  });
});

describe('lessonResourceService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
  });

  it('creates resource with lessonId', async () => {
    const resource = makeResource();
    prismaMock.lessonResource.create.mockResolvedValue(resource);

    const input = { type: 'note' as const, title: 'Test', content: {}, order: 1, isRequired: false };
    const result = await lessonResourceService.create(LESSON_ID, input);

    expect(prismaMock.lessonResource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lessonId: LESSON_ID }),
      }),
    );
    expect(result).toEqual(resource);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    const input = { type: 'note' as const, title: 'Test', content: {}, order: 1, isRequired: false };

    await expect(lessonResourceService.create(LESSON_ID, input)).rejects.toThrow(NotFoundError);
  });
});

describe('lessonResourceService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lessonResource.findUnique.mockResolvedValue(makeResource());
  });

  it('updates the resource and returns updated record', async () => {
    const updated = makeResource({ title: 'Updated Title' });
    prismaMock.lessonResource.update.mockResolvedValue(updated);

    const result = await lessonResourceService.update(RESOURCE_ID, { title: 'Updated Title' });

    expect(prismaMock.lessonResource.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: RESOURCE_ID } }),
    );
    expect(result).toEqual(updated);
  });

  it('throws NotFoundError when resource does not exist', async () => {
    prismaMock.lessonResource.findUnique.mockResolvedValue(null);

    await expect(lessonResourceService.update(RESOURCE_ID, {})).rejects.toThrow(NotFoundError);
  });
});

describe('lessonResourceService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lessonResource.findUnique.mockResolvedValue(makeResource());
  });

  it('hard-deletes the resource', async () => {
    prismaMock.lessonResource.delete.mockResolvedValue(makeResource());

    await lessonResourceService.remove(RESOURCE_ID);

    expect(prismaMock.lessonResource.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: RESOURCE_ID } }),
    );
  });

  it('throws NotFoundError when resource does not exist', async () => {
    prismaMock.lessonResource.findUnique.mockResolvedValue(null);

    await expect(lessonResourceService.remove(RESOURCE_ID)).rejects.toThrow(NotFoundError);
  });
});
