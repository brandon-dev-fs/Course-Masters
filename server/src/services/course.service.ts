import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateCourseInput, UpdateCourseInput } from '../schemas/course.schema.js';

export const courseService = {
  async findAll() {
    return prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { units: true } } },
    });
  },

  async findById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { lessons: true } } },
        },
      },
    });
    if (!course) throw new NotFoundError('Course not found');
    return course;
  },

  async create(data: CreateCourseInput, userId: string) {
    return prisma.course.create({ data: { ...data, authorId: userId } });
  },

  async update(id: string, data: UpdateCourseInput) {
    await this.findById(id);
    return prisma.course.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.findById(id);
    await prisma.course.delete({ where: { id } });
  },
};
