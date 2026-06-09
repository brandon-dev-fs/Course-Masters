import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import { softDeleteUnit } from '../utils/softDelete.js';
import type { CreateUnitInput, UpdateUnitInput } from '../schemas/unit.schema.js';

export const unitService = {
  async findAllByCourse(courseId: string) {
    // Treat soft-deleted parent Course as non-existent
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) throw new NotFoundError('Course not found');

    return prisma.unit.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { order: 'asc' },
      include: { _count: { select: { lessons: { where: { deletedAt: null } } } } },
    });
  },

  async findById(id: string) {
    const unit = await prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: {
        lessons: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
    });
    if (!unit) throw new NotFoundError('Unit not found');
    return unit;
  },

  async create(courseId: string, data: CreateUnitInput) {
    // Treat soft-deleted parent Course as non-existent
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) throw new NotFoundError('Course not found');

    return prisma.unit.create({ data: { ...data, courseId } });
  },

  async update(id: string, data: UpdateUnitInput) {
    await this.findById(id);
    return prisma.unit.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.findById(id);
    await prisma.$transaction(async tx => {
      await softDeleteUnit(tx, id);
    });
  },
};
