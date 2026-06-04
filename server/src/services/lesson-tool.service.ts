import { ToolType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { assertExists } from '../utils/assertExists.js';
import { NotFoundError, ConflictError } from '../errors/index.js';
import type { CreateLessonToolInput, UpdateLessonToolInput } from '../schemas/lesson-tool.schema.js';

export const lessonToolService = {
  async findAllByLesson(lessonId: string, type?: ToolType) {
    return prisma.lessonTool.findMany({
      where: type ? { lessonId, type } : { lessonId },
      orderBy: { order: 'asc' },
    });
  },

  async create(lessonId: string, data: CreateLessonToolInput) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');
    return prisma.lessonTool.create({ data: { ...data, lessonId } });
  },

  async update(id: string, data: UpdateLessonToolInput) {
    await assertExists(prisma.lessonTool, id, 'Tool');
    return prisma.lessonTool.update({ where: { id }, data });
  },

  async remove(id: string) {
    await assertExists(prisma.lessonTool, id, 'Tool');
    await prisma.lessonTool.delete({ where: { id } });
  },

  async getSavedVocabFlashCards(lessonId: string, userId: string) {
    const saved = await prisma.studentVocabFlashCard.findMany({
      where: { userId, tool: { lessonId } },
      include: { tool: true },
    });
    return saved.map(s => s.tool);
  },

  async saveVocabFlashCard(toolId: string, userId: string) {
    const tool = await prisma.lessonTool.findUnique({ where: { id: toolId } });
    if (!tool) throw new NotFoundError('Tool not found');
    if (tool.type !== 'vocab') throw new ConflictError('Only vocab tools can be saved as flashcards');
    return prisma.studentVocabFlashCard.create({ data: { userId, toolId } });
  },

  async removeVocabFlashCard(toolId: string, userId: string) {
    const record = await prisma.studentVocabFlashCard.findUnique({
      where: { userId_toolId: { userId, toolId } },
    });
    if (!record) throw new NotFoundError('Vocab flashcard not found');
    await prisma.studentVocabFlashCard.delete({ where: { userId_toolId: { userId, toolId } } });
  },
};
