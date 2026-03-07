import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateCourseInput, UpdateCourseInput } from '../schemas/course.schema.js';

const DEFAULT_AUTHOR_ID = 'default-user-placeholder'; // replaced with req.user.id when auth added

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new NotFoundError('No users found — run seed first');
  return user.id;
}

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

  async create(data: CreateCourseInput) {
    const authorId = await getDefaultUserId();
    return prisma.course.create({ data: { ...data, authorId } });
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
