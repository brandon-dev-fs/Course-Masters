import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

import { AppError, ConflictError, NotFoundError, ValidationError } from '../errors/index.js';

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
          phase: 'pre_load',
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

  async approveElicitation(sessionId: string, userId: string) {
    const session = await prisma.agentSession.findFirst({
      where: { id: sessionId, userId },
      include: { courseSpec: { select: { id: true, status: true } } },
    });

    if (!session) throw new NotFoundError('Agent session not found');

    if (session.expiresAt !== null && session.expiresAt < new Date()) {
      throw new AppError('SESSION_EXPIRED', 'Session has expired', 400);
    }

    if (session.phase !== 'elicitation') {
      throw new AppError(
        'INVALID_PHASE',
        `Cannot approve elicitation from phase '${session.phase}'. Session must be in 'elicitation' phase.`,
        400,
      );
    }

    const state = (session.elicitationState as Record<string, unknown>) ?? {};
    const stagesCompleted = (state['stagesCompleted'] as string[]) ?? [];
    const REQUIRED_STAGES = [
      'topic',
      'scope',
      'source_coverage',
      'prior_knowledge',
      'preferences',
      'goals',
    ];

    const missingStages = REQUIRED_STAGES.filter((s) => !stagesCompleted.includes(s));
    if (missingStages.length > 0) {
      throw new ValidationError(
        `Elicitation incomplete. Missing stages: ${missingStages.join(', ')}`,
        { missingStages },
      );
    }

    // Cast to object — Prisma accepts Json columns as plain objects. Values come from
    // the agent's elicitationState which is itself Json, so the cast is safe here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elicitationData: Record<string, any> = {
      topic: state['topic'],
      scope: state['scope'],
      depth: state['depth'],
      sourceCoverage: state['sourceCoverage'],
      priorKnowledge: state['priorKnowledge'],
      contentPreferences: state['contentPreferences'],
      pace: state['pace'],
      accessibilityNeeds: state['accessibilityNeeds'] ?? null,
      goals: state['goals'],
    };

    const courseSpecId = session.courseSpec?.id ?? null;

    await prisma.$transaction(async (tx) => {
      if (courseSpecId) {
        await tx.courseSpec.update({
          where: { id: courseSpecId },
          data: { status: 'reviewing', elicitationData },
        });
      }
      await tx.agentSession.update({
        where: { id: sessionId },
        data: { phase: 'outline' },
      });
    });

    logger.info({ sessionId, userId, courseSpecId }, 'Elicitation approved, session advanced to outline phase');

    return { phase: 'outline', courseSpecId };
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
