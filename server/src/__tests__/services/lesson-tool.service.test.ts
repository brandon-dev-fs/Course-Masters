import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LessonTool } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { lessonToolService } from '../../services/lesson-tool.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

function makeTool(overrides: Partial<LessonTool> = {}): LessonTool {
  return {
    id: 'tool-1',
    lessonId: 'lesson-1',
    type: 'flash_card',
    title: 'Test Tool',
    content: {},
    order: 1,
    isRequired: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const LESSON_ID = 'lesson-1';
const TOOL_ID = 'tool-1';
const mockLesson = { id: LESSON_ID, title: 'Lesson 1' };

describe('lessonToolService.findAllByLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all tools sorted by order', async () => {
    const tools = [makeTool({ order: 1 }), makeTool({ id: 'tool-2', order: 2 })];
    prismaMock.lessonTool.findMany.mockResolvedValue(tools);

    const result = await lessonToolService.findAllByLesson(LESSON_ID);

    expect(prismaMock.lessonTool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { order: 'asc' } }),
    );
    expect(result).toEqual(tools);
  });

  it('filters by type when type is provided', async () => {
    prismaMock.lessonTool.findMany.mockResolvedValue([makeTool({ type: 'flash_card' })]);

    await lessonToolService.findAllByLesson(LESSON_ID, 'flash_card');

    expect(prismaMock.lessonTool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lessonId: LESSON_ID, type: 'flash_card' } }),
    );
  });

  it('does not filter by type when type is not provided', async () => {
    prismaMock.lessonTool.findMany.mockResolvedValue([]);

    await lessonToolService.findAllByLesson(LESSON_ID);

    expect(prismaMock.lessonTool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lessonId: LESSON_ID } }),
    );
  });
});

describe('lessonToolService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
  });

  it('creates tool with lessonId', async () => {
    const tool = makeTool();
    prismaMock.lessonTool.create.mockResolvedValue(tool);

    const input = { type: 'flash_card' as const, title: 'Test', content: {}, order: 1, isRequired: false };
    const result = await lessonToolService.create(LESSON_ID, input);

    expect(prismaMock.lessonTool.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lessonId: LESSON_ID }),
      }),
    );
    expect(result).toEqual(tool);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    const input = { type: 'flash_card' as const, title: 'Test', content: {}, order: 1, isRequired: false };

    await expect(lessonToolService.create(LESSON_ID, input)).rejects.toThrow(NotFoundError);
  });
});

describe('lessonToolService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lessonTool.findUnique.mockResolvedValue(makeTool());
  });

  it('updates the tool and returns updated record', async () => {
    const updated = makeTool({ title: 'Updated Tool' });
    prismaMock.lessonTool.update.mockResolvedValue(updated);

    const result = await lessonToolService.update(TOOL_ID, { title: 'Updated Tool' });

    expect(prismaMock.lessonTool.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: TOOL_ID } }),
    );
    expect(result).toEqual(updated);
  });

  it('throws NotFoundError when tool does not exist', async () => {
    prismaMock.lessonTool.findUnique.mockResolvedValue(null);

    await expect(lessonToolService.update(TOOL_ID, {})).rejects.toThrow(NotFoundError);
  });
});

describe('lessonToolService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lessonTool.findUnique.mockResolvedValue(makeTool());
  });

  it('hard-deletes the tool', async () => {
    prismaMock.lessonTool.delete.mockResolvedValue(makeTool());

    await lessonToolService.remove(TOOL_ID);

    expect(prismaMock.lessonTool.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: TOOL_ID } }),
    );
  });

  it('throws NotFoundError when tool does not exist', async () => {
    prismaMock.lessonTool.findUnique.mockResolvedValue(null);

    await expect(lessonToolService.remove(TOOL_ID)).rejects.toThrow(NotFoundError);
  });
});
