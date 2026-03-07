import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateUnitInput, UpdateUnitInput } from '../schemas/unit.schema.js';

export const unitService = {
  async findAllByCourse(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('Course not found');
    return prisma.unit.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { lessons: true } } },
    });
  },

  async findById(id: string) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { order: 'asc' } },
      },
    });
    if (!unit) throw new NotFoundError('Unit not found');
    return unit;
  },

  async create(courseId: string, data: CreateUnitInput) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('Course not found');
    return prisma.unit.create({ data: { ...data, courseId } });
  },

  async update(id: string, data: UpdateUnitInput) {
    await this.findById(id);
    return prisma.unit.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.findById(id);
    await prisma.unit.delete({ where: { id } });
  },
};
