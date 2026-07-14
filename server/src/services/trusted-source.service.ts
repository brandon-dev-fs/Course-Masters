import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';

import type { CreateTrustedSourceInput, UpdateTrustedSourceInput, TrustedSourceQuery } from '../schemas/trusted-source.schema.js';

export const trustedSourceService = {
  async list(query: TrustedSourceQuery) {
    const where =
      query.active !== undefined ? { active: query.active === 'true' } : undefined;

    return prisma.trustedSource.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  },

  async create(data: CreateTrustedSourceInput) {
    return prisma.trustedSource.create({
      data: {
        name: data.name,
        domain: data.domain,
        contentTypes: data.contentTypes,
        categories: data.categories,
        active: data.active,
      },
    });
  },

  async update(sourceId: string, data: UpdateTrustedSourceInput) {
    const existing = await prisma.trustedSource.findUnique({ where: { id: sourceId } });
    if (!existing) throw new NotFoundError('Trusted source not found');

    return prisma.trustedSource.update({
      where: { id: sourceId },
      data,
    });
  },

  async deactivate(sourceId: string): Promise<void> {
    const existing = await prisma.trustedSource.findUnique({ where: { id: sourceId } });
    if (!existing) throw new NotFoundError('Trusted source not found');

    await prisma.trustedSource.update({
      where: { id: sourceId },
      data: { active: false },
    });
  },
};
