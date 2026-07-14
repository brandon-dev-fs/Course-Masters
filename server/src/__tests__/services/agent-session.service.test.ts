import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { agentSessionService } from '../../services/agent-session.service.js';
import { AppError } from '../../errors/AppError.js';
import { NotFoundError } from '../../errors/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-1';
const SESSION_ID = 'session-1';
const SPEC_ID = 'spec-1';

function makeCourseSpec(overrides: Record<string, unknown> = {}) {
  return {
    id: SPEC_ID,
    userId: USER_ID,
    courseId: null,
    status: 'drafting',
    elicitationData: null,
    outline: null,
    buildLog: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    userId: USER_ID,
    courseSpecId: SPEC_ID,
    phase: 'elicitation',
    currentStep: null,
    elicitationState: null,
    conversationLog: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('agentSessionService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns new session with courseSpec when no active session exists', async () => {
    const spec = makeCourseSpec();
    const session = {
      ...makeSession(),
      courseSpec: { id: spec.id, status: spec.status, elicitationData: null, outline: null },
    };

    prismaMock.agentSession.findFirst.mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    prismaMock.courseSpec.create.mockResolvedValue(spec);
    prismaMock.agentSession.create.mockResolvedValue(session);

    const result = await agentSessionService.create(USER_ID);

    expect(prismaMock.agentSession.findFirst).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
      },
      select: { id: true },
    });
    expect(prismaMock.courseSpec.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, status: 'drafting' },
      select: { id: true },
    });
    expect(prismaMock.agentSession.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        courseSpecId: spec.id,
        phase: 'elicitation',
        expiresAt: expect.any(Date),
      },
      include: {
        courseSpec: {
          select: { id: true, status: true, elicitationData: true, outline: true },
        },
      },
    });
    expect(result).toEqual(session);
  });

  it('throws AppError with AGENT_SESSION_CONFLICT code when active session exists', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(makeSession());

    await expect(agentSessionService.create(USER_ID)).rejects.toThrow(AppError);
    await expect(agentSessionService.create(USER_ID)).rejects.toMatchObject({
      code: 'AGENT_SESSION_CONFLICT',
      statusCode: 409,
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe('agentSessionService.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns sessions ordered by createdAt desc', async () => {
    const sessions = [
      {
        id: SESSION_ID,
        phase: 'elicitation',
        currentStep: null,
        expiresAt: makeSession().expiresAt,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        courseSpec: { id: SPEC_ID, status: 'drafting', elicitationData: null, outline: null },
      },
    ];
    prismaMock.agentSession.findMany.mockResolvedValue(sessions);

    const result = await agentSessionService.list(USER_ID);

    expect(prismaMock.agentSession.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
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
    expect(result).toEqual(sessions);
  });

  it('returns empty array when no sessions exist', async () => {
    prismaMock.agentSession.findMany.mockResolvedValue([]);

    const result = await agentSessionService.list(USER_ID);

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------

describe('agentSessionService.getById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns session with expired=false when expiresAt is in the future', async () => {
    const futureExpiry = new Date(Date.now() + 1_000_000);
    const session = {
      ...makeSession({ expiresAt: futureExpiry }),
      courseSpec: makeCourseSpec(),
    };
    prismaMock.agentSession.findFirst.mockResolvedValue(session);

    const result = await agentSessionService.getById(SESSION_ID, USER_ID);

    expect(result.expired).toBe(false);
  });

  it('returns session with expired=true when expiresAt is in the past', async () => {
    const pastExpiry = new Date(Date.now() - 1_000_000);
    const session = {
      ...makeSession({ expiresAt: pastExpiry }),
      courseSpec: makeCourseSpec(),
    };
    prismaMock.agentSession.findFirst.mockResolvedValue(session);

    const result = await agentSessionService.getById(SESSION_ID, USER_ID);

    expect(result.expired).toBe(true);
  });

  it('throws NotFoundError when session not found', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(null);

    await expect(agentSessionService.getById(SESSION_ID, USER_ID)).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// abandon
// ---------------------------------------------------------------------------

describe('agentSessionService.abandon', () => {
  beforeEach(() => vi.clearAllMocks());

  it('soft-deletes CourseSpec and hard-deletes session when status is drafting', async () => {
    const spec = makeCourseSpec({ status: 'drafting' });
    const session = { ...makeSession(), courseSpec: { id: spec.id, status: spec.status } };
    prismaMock.agentSession.findFirst.mockResolvedValue(session);
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    prismaMock.courseSpec.update.mockResolvedValue(spec);
    prismaMock.agentSession.delete.mockResolvedValue(session);

    await agentSessionService.abandon(SESSION_ID, USER_ID);

    expect(prismaMock.courseSpec.update).toHaveBeenCalledWith({
      where: { id: spec.id },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaMock.agentSession.delete).toHaveBeenCalledWith({ where: { id: SESSION_ID } });
  });

  it('soft-deletes CourseSpec and hard-deletes session when status is reviewing', async () => {
    const spec = makeCourseSpec({ status: 'reviewing' });
    const session = { ...makeSession(), courseSpec: { id: spec.id, status: spec.status } };
    prismaMock.agentSession.findFirst.mockResolvedValue(session);
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    prismaMock.courseSpec.update.mockResolvedValue(spec);
    prismaMock.agentSession.delete.mockResolvedValue(session);

    await agentSessionService.abandon(SESSION_ID, USER_ID);

    expect(prismaMock.courseSpec.update).toHaveBeenCalledWith({
      where: { id: spec.id },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaMock.agentSession.delete).toHaveBeenCalledWith({ where: { id: SESSION_ID } });
  });

  it('soft-deletes CourseSpec and hard-deletes session when status is failed', async () => {
    const spec = makeCourseSpec({ status: 'failed' });
    const session = { ...makeSession(), courseSpec: { id: spec.id, status: spec.status } };
    prismaMock.agentSession.findFirst.mockResolvedValue(session);
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    prismaMock.courseSpec.update.mockResolvedValue(spec);
    prismaMock.agentSession.delete.mockResolvedValue(session);

    await agentSessionService.abandon(SESSION_ID, USER_ID);

    expect(prismaMock.courseSpec.update).toHaveBeenCalledWith({
      where: { id: spec.id },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaMock.agentSession.delete).toHaveBeenCalledWith({ where: { id: SESSION_ID } });
  });

  it('preserves CourseSpec and hard-deletes session when status is approved', async () => {
    const spec = makeCourseSpec({ status: 'approved' });
    const session = { ...makeSession(), courseSpec: { id: spec.id, status: spec.status } };
    prismaMock.agentSession.findFirst.mockResolvedValue(session);
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    prismaMock.agentSession.delete.mockResolvedValue(session);

    await agentSessionService.abandon(SESSION_ID, USER_ID);

    expect(prismaMock.courseSpec.update).not.toHaveBeenCalled();
    expect(prismaMock.agentSession.delete).toHaveBeenCalledWith({ where: { id: SESSION_ID } });
  });

  it('preserves CourseSpec and hard-deletes session when status is completed', async () => {
    const spec = makeCourseSpec({ status: 'completed' });
    const session = { ...makeSession(), courseSpec: { id: spec.id, status: spec.status } };
    prismaMock.agentSession.findFirst.mockResolvedValue(session);
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    prismaMock.agentSession.delete.mockResolvedValue(session);

    await agentSessionService.abandon(SESSION_ID, USER_ID);

    expect(prismaMock.courseSpec.update).not.toHaveBeenCalled();
    expect(prismaMock.agentSession.delete).toHaveBeenCalledWith({ where: { id: SESSION_ID } });
  });

  it('hard-deletes session when courseSpec is null', async () => {
    const session = { ...makeSession(), courseSpec: null };
    prismaMock.agentSession.findFirst.mockResolvedValue(session);
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    prismaMock.agentSession.delete.mockResolvedValue(session);

    await agentSessionService.abandon(SESSION_ID, USER_ID);

    expect(prismaMock.courseSpec.update).not.toHaveBeenCalled();
    expect(prismaMock.agentSession.delete).toHaveBeenCalledWith({ where: { id: SESSION_ID } });
  });

  it('throws NotFoundError when session not found', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(null);

    await expect(agentSessionService.abandon(SESSION_ID, USER_ID)).rejects.toThrow(NotFoundError);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
