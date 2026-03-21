import prisma from '../../lib/prisma.js';
import { NotFoundError } from '../../errors/index.js';

interface LessonContentDelegate {
  findMany(args: any): Promise<any[]>;
  findUnique(args: any): Promise<any>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
}

export function createLessonContentService(delegate: LessonContentDelegate, entityName: string) {
  return {
    async findAllByLesson(lessonId: string) {
      return delegate.findMany({ where: { lessonId }, orderBy: { order: 'asc' } });
    },

    async create(lessonId: string, data: Record<string, unknown>) {
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) throw new NotFoundError('Lesson not found');
      return delegate.create({ data: { ...data, lessonId } });
    },

    async update(id: string, data: Record<string, unknown>) {
      const item = await delegate.findUnique({ where: { id } });
      if (!item) throw new NotFoundError(`${entityName} not found`);
      return delegate.update({ where: { id }, data });
    },

    async remove(id: string) {
      const item = await delegate.findUnique({ where: { id } });
      if (!item) throw new NotFoundError(`${entityName} not found`);
      await delegate.delete({ where: { id } });
    },
  };
}
