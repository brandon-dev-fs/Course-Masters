import prisma from '../lib/prisma.js';
import { NotFoundError, AppError } from '../errors/index.js';
import { softDeleteCourse } from '../utils/softDelete.js';
import type { CreateCourseInput, UpdateCourseInput } from '../schemas/course.schema.js';

export const courseService = {
  async findAll() {
    return prisma.course.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { units: { where: { deletedAt: null } } } },
      },
    });
  },

  async findById(id: string) {
    const course = await prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, name: true } },
        units: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            lessons: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
            _count: { select: { lessons: { where: { deletedAt: null } } } },
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
    await prisma.$transaction(async tx => {
      await softDeleteCourse(tx, id);
    });
  },
};
