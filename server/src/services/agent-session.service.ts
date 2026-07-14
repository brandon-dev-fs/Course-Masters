import prisma from '../lib/prisma.js';

import { ConflictError, NotFoundError } from '../errors/index.js';

export const agentSessionService = {
  async create(userId: string) {
    const activeSession = await prisma.agentSession.findFirst({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    });

    if (activeSession) {
      throw new ConflictError(
        'An active agent session already exists. Abandon it before creating a new one.',
        'AGENT_SESSION_CONFLICT',
      );
    }

    return prisma.$transaction(async (tx) => {
      const spec = await tx.courseSpec.create({
        data: { userId, status: 'drafting' },
        select: { id: true },
      });

      return tx.agentSession.create({
        data: {
          userId,
          courseSpecId: spec.id,
          phase: 'elicitation',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        include: {
          courseSpec: {
            select: { id: true, status: true, elicitationData: true, outline: true },
          },
        },
      });
    });
  },

  async list(userId: string) {
    return prisma.agentSession.findMany({
      where: { userId },
      select: {
        id: true,
        phase: true,
        currentStep: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        courseSpec: {
          select: { id: true, status: true, elicitationData: true, outline: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(sessionId: string, userId: string) {
    const session = await prisma.agentSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        courseSpec: {
          select: {
            id: true,
            userId: true,
            courseId: true,
            status: true,
            elicitationData: true,
            outline: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!session) throw new NotFoundError('Agent session not found');

    const expired = session.expiresAt !== null && session.expiresAt < new Date();

    return { ...session, expired };
  },

  async abandon(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.agentSession.findFirst({
      where: { id: sessionId, userId },
      include: { courseSpec: { select: { id: true, status: true } } },
    });

    if (!session) throw new NotFoundError('Agent session not found');

    const softDeleteStatuses = ['drafting', 'reviewing', 'failed'];
    const shouldSoftDelete =
      session.courseSpec !== null &&
      softDeleteStatuses.includes(session.courseSpec.status);

    await prisma.$transaction(async (tx) => {
      if (shouldSoftDelete && session.courseSpec) {
        await tx.courseSpec.update({
          where: { id: session.courseSpec.id },
          data: { deletedAt: new Date() },
        });
      }
      await tx.agentSession.delete({ where: { id: sessionId } });
    });
  },
};
