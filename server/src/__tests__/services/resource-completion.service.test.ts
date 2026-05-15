import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { resourceCompletionService } from '../../services/resource-completion.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

const LESSON_ID = 'lesson-1';
const USER_ID = 'user-1';
const RESOURCE_ID = 'resource-1';
const TOOL_ID = 'tool-1';

describe('resourceCompletionService.getByLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lessonResourceCompletion.findMany.mockResolvedValue([]);
    prismaMock.lessonToolCompletion.findMany.mockResolvedValue([]);
    prismaMock.lessonResource.findMany.mockResolvedValue([]);
    prismaMock.lessonTool.findMany.mockResolvedValue([]);
  });

  it('returns empty completions and requiredItems when nothing exists', async () => {
    const result = await resourceCompletionService.getByLesson(LESSON_ID, USER_ID);

    expect(result.completions).toEqual([]);
    expect(result.requiredItems).toEqual([]);
  });

  it('returns resource completions mapped to completion items', async () => {
    const completedAt = new Date();
    prismaMock.lessonResourceCompletion.findMany.mockResolvedValue([
      { resourceId: RESOURCE_ID, completedAt },
    ]);
    prismaMock.lessonResource.findMany.mockResolvedValue([
      { id: RESOURCE_ID, isRequired: true },
    ]);

    const result = await resourceCompletionService.getByLesson(LESSON_ID, USER_ID);

    expect(result.completions).toEqual([
      { type: 'resource', targetId: RESOURCE_ID, completedAt },
    ]);
  });

  it('marks required items as completed when resource is in completions', async () => {
    prismaMock.lessonResourceCompletion.findMany.mockResolvedValue([
      { resourceId: RESOURCE_ID, completedAt: new Date() },
    ]);
    prismaMock.lessonResource.findMany.mockResolvedValue([
      { id: RESOURCE_ID, isRequired: true },
    ]);

    const result = await resourceCompletionService.getByLesson(LESSON_ID, USER_ID);

    expect(result.requiredItems).toContainEqual(
      expect.objectContaining({ targetId: RESOURCE_ID, completed: true }),
    );
  });

  it('marks required items as not completed when resource is not in completions', async () => {
    prismaMock.lessonResourceCompletion.findMany.mockResolvedValue([]);
    prismaMock.lessonResource.findMany.mockResolvedValue([
      { id: RESOURCE_ID, isRequired: true },
    ]);

    const result = await resourceCompletionService.getByLesson(LESSON_ID, USER_ID);

    expect(result.requiredItems).toContainEqual(
      expect.objectContaining({ targetId: RESOURCE_ID, completed: false }),
    );
  });

  it('returns tool completions mapped to completion items', async () => {
    const completedAt = new Date();
    prismaMock.lessonToolCompletion.findMany.mockResolvedValue([
      { toolId: TOOL_ID, completedAt },
    ]);
    prismaMock.lessonTool.findMany.mockResolvedValue([
      { id: TOOL_ID, isRequired: false },
    ]);

    const result = await resourceCompletionService.getByLesson(LESSON_ID, USER_ID);

    expect(result.completions).toContainEqual(
      expect.objectContaining({ type: 'tool', targetId: TOOL_ID }),
    );
  });
});

describe('resourceCompletionService.toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lessonResourceCompletion.findMany.mockResolvedValue([]);
    prismaMock.lessonToolCompletion.findMany.mockResolvedValue([]);
    prismaMock.lessonResource.findMany.mockResolvedValue([]);
    prismaMock.lessonTool.findMany.mockResolvedValue([]);
  });

  it('creates resource completion when none exists', async () => {
    prismaMock.lessonResource.findUnique.mockResolvedValue({ id: RESOURCE_ID, lessonId: LESSON_ID });
    prismaMock.lessonResourceCompletion.findUnique.mockResolvedValue(null);
    prismaMock.lessonResourceCompletion.create.mockResolvedValue({ id: 'comp-1' });

    await resourceCompletionService.toggle(LESSON_ID, USER_ID, 'resource', RESOURCE_ID);

    expect(prismaMock.lessonResourceCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: USER_ID, resourceId: RESOURCE_ID } }),
    );
  });

  it('deletes resource completion when one exists (toggle off)', async () => {
    prismaMock.lessonResource.findUnique.mockResolvedValue({ id: RESOURCE_ID, lessonId: LESSON_ID });
    prismaMock.lessonResourceCompletion.findUnique.mockResolvedValue({ id: 'comp-1' });
    prismaMock.lessonResourceCompletion.delete.mockResolvedValue({ id: 'comp-1' });

    await resourceCompletionService.toggle(LESSON_ID, USER_ID, 'resource', RESOURCE_ID);

    expect(prismaMock.lessonResourceCompletion.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'comp-1' } }),
    );
  });

  it('throws NotFoundError when resource is not found in the lesson', async () => {
    prismaMock.lessonResource.findUnique.mockResolvedValue(null);

    await expect(
      resourceCompletionService.toggle(LESSON_ID, USER_ID, 'resource', RESOURCE_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when resource belongs to a different lesson', async () => {
    prismaMock.lessonResource.findUnique.mockResolvedValue({ id: RESOURCE_ID, lessonId: 'other-lesson' });

    await expect(
      resourceCompletionService.toggle(LESSON_ID, USER_ID, 'resource', RESOURCE_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('creates tool completion when none exists', async () => {
    prismaMock.lessonTool.findUnique.mockResolvedValue({ id: TOOL_ID, lessonId: LESSON_ID });
    prismaMock.lessonToolCompletion.findUnique.mockResolvedValue(null);
    prismaMock.lessonToolCompletion.create.mockResolvedValue({ id: 'tc-1' });

    await resourceCompletionService.toggle(LESSON_ID, USER_ID, 'tool', TOOL_ID);

    expect(prismaMock.lessonToolCompletion.create).toHaveBeenCalled();
  });

  it('throws NotFoundError when tool belongs to a different lesson', async () => {
    prismaMock.lessonTool.findUnique.mockResolvedValue({ id: TOOL_ID, lessonId: 'other-lesson' });

    await expect(
      resourceCompletionService.toggle(LESSON_ID, USER_ID, 'tool', TOOL_ID),
    ).rejects.toThrow(NotFoundError);
  });
});
