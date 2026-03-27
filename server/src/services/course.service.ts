import prisma from '../lib/prisma.js';
import { NotFoundError, AppError } from '../errors/index.js';
import type { CreateCourseInput, UpdateCourseInput } from '../schemas/course.schema.js';

export const courseService = {
  async findAll() {
    return prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { units: true } },
      },
    });
  },

  async findById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        units: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
            _count: { select: { lessons: true } },
          },
        },
      },
    });
    if (!course) throw new NotFoundError('Course not found');
    return course;
  },

  async create(data: CreateCourseInput, userId: string) {
    return prisma.course.create({ data: { ...data, authorId: userId } });
  },

  async update(id: string, data: UpdateCourseInput, userId: string, userRole: string) {
    const course = await this.findById(id);
    if (course.authorId !== userId && userRole !== 'admin') {
      throw new AppError('FORBIDDEN', 'You can only modify your own courses', 403);
    }
    return prisma.course.update({ where: { id }, data });
  },

  async remove(id: string, userId: string, userRole: string) {
    const course = await this.findById(id);
    if (course.authorId !== userId && userRole !== 'admin') {
      throw new AppError('FORBIDDEN', 'You can only delete your own courses', 403);
    }
    await prisma.course.delete({ where: { id } });
  },
};
