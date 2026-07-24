import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these objects are available inside vi.mock factories,
// which are hoisted to the top of the file before any other declarations.
const { mockAgentSessionService, mockRunAgentTurn } = vi.hoisted(() => ({
  mockAgentSessionService: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    abandon: vi.fn(),
  },
  mockRunAgentTurn: vi.fn(),
}));

vi.mock('../../services/agent-session.service.js', () => ({
  agentSessionService: mockAgentSessionService,
}));
vi.mock('../../services/agent-loop.service.js', () => ({
  runAgentTurn: mockRunAgentTurn,
}));

import { agentSessionController } from '../../controllers/agent-session.controller.js';
import { makeReq } from '../mocks/express.js';
import { AppError } from '../../errors/AppError.js';
import type { Response } from 'express';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** makeRes with setHeader for SSE tests. */
function makeRes() {
  const res = {
    statusCode: 200,
    locals: {} as Record<string, unknown>,
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  };
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

function makeNext() {
  return vi.fn();
}

async function callHandler(
  handler: Function,
  req: ReturnType<typeof makeReq>,
  res = makeRes(),
) {
  const next = makeNext();
  handler(req, res as unknown as Response, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

const USER_ID = 'user-1';
const SESSION_ID = 'session-1';

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    userId: USER_ID,
    phase: 'elicitation',
    expired: false,
    expiresAt: new Date(Date.now() + 86_400_000),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    courseSpec: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('agentSessionController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds 201 with the created session', async () => {
    const session = makeSession();
    mockAgentSessionService.create.mockResolvedValue(session);
    const req = makeReq({ user: { id: USER_ID } });

    const { res, next } = await callHandler(agentSessionController.create, req);

    expect(mockAgentSessionService.create).toHaveBeenCalledWith(USER_ID);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(session);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    mockAgentSessionService.create.mockRejectedValue(new Error('conflict'));

    const { next } = await callHandler(
      agentSessionController.create,
      makeReq({ user: { id: USER_ID } }),
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe('agentSessionController.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds with the session list', async () => {
    const sessions = [makeSession()];
    mockAgentSessionService.list.mockResolvedValue(sessions);
    const req = makeReq({ user: { id: USER_ID } });

    const { res, next } = await callHandler(agentSessionController.list, req);

    expect(mockAgentSessionService.list).toHaveBeenCalledWith(USER_ID);
    expect(res.json).toHaveBeenCalledWith(sessions);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    mockAgentSessionService.list.mockRejectedValue(new Error('db error'));

    const { next } = await callHandler(
      agentSessionController.list,
      makeReq({ user: { id: USER_ID } }),
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------

describe('agentSessionController.getById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds with the session', async () => {
    const session = makeSession();
    mockAgentSessionService.getById.mockResolvedValue(session);
    const req = makeReq({ user: { id: USER_ID }, params: { sessionId: SESSION_ID } });

    const { res, next } = await callHandler(agentSessionController.getById, req);

    expect(mockAgentSessionService.getById).toHaveBeenCalledWith(SESSION_ID, USER_ID);
    expect(res.json).toHaveBeenCalledWith(session);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error when session is not found', async () => {
    mockAgentSessionService.getById.mockRejectedValue(new Error('not found'));

    const { next } = await callHandler(
      agentSessionController.getById,
      makeReq({ user: { id: USER_ID }, params: { sessionId: SESSION_ID } }),
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ---------------------------------------------------------------------------
// abandon
// ---------------------------------------------------------------------------

describe('agentSessionController.abandon', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responds 204 on success', async () => {
    mockAgentSessionService.abandon.mockResolvedValue(undefined);
    const req = makeReq({ user: { id: USER_ID }, params: { sessionId: SESSION_ID } });

    const { res, next } = await callHandler(agentSessionController.abandon, req);

    expect(mockAgentSessionService.abandon).toHaveBeenCalledWith(SESSION_ID, USER_ID);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    mockAgentSessionService.abandon.mockRejectedValue(new Error('abandon fail'));

    const { next } = await callHandler(
      agentSessionController.abandon,
      makeReq({ user: { id: USER_ID }, params: { sessionId: SESSION_ID } }),
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

describe('agentSessionController.sendMessage', () => {
  beforeEach(() => vi.clearAllMocks());

  function validReq() {
    return makeReq({
      user: { id: USER_ID },
      params: { sessionId: SESSION_ID },
      body: { message: 'Hello' },
    });
  }

  it('sets X-Accel-Buffering header and pipes the stream on success', async () => {
    const mockPipe = vi.fn().mockResolvedValue(undefined);
    mockAgentSessionService.getById.mockResolvedValue(
      makeSession({ expired: false, phase: 'elicitation' }),
    );
    mockRunAgentTurn.mockResolvedValue({ pipeUIMessageStreamToResponse: mockPipe });

    const res = makeRes();
    const next = makeNext();
    agentSessionController.sendMessage(validReq(), res as unknown as Response, next);
    await new Promise((r) => setTimeout(r, 10));

    expect(res.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
    expect(mockRunAgentTurn).toHaveBeenCalledWith(SESSION_ID, 'Hello');
    expect(mockPipe).toHaveBeenCalledWith(res);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with SESSION_EXPIRED AppError when session is expired', async () => {
    mockAgentSessionService.getById.mockResolvedValue(makeSession({ expired: true }));

    const { next } = await callHandler(agentSessionController.sendMessage, validReq());

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).code).toBe('SESSION_EXPIRED');
  });

  it('calls next with PHASE_NOT_INTERACTIVE AppError for build phase', async () => {
    mockAgentSessionService.getById.mockResolvedValue(
      makeSession({ expired: false, phase: 'build' }),
    );

    const { next } = await callHandler(agentSessionController.sendMessage, validReq());

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).code).toBe('PHASE_NOT_INTERACTIVE');
  });

  it('calls next with PHASE_NOT_INTERACTIVE AppError for summary phase', async () => {
    mockAgentSessionService.getById.mockResolvedValue(
      makeSession({ expired: false, phase: 'summary' }),
    );

    const { next } = await callHandler(agentSessionController.sendMessage, validReq());

    expect((next.mock.calls[0][0] as AppError).code).toBe('PHASE_NOT_INTERACTIVE');
  });

  it('calls next with error when runAgentTurn rejects', async () => {
    mockAgentSessionService.getById.mockResolvedValue(
      makeSession({ expired: false, phase: 'elicitation' }),
    );
    mockRunAgentTurn.mockRejectedValue(new Error('llm error'));

    const res = makeRes();
    const next = makeNext();
    agentSessionController.sendMessage(validReq(), res as unknown as Response, next);
    await new Promise((r) => setTimeout(r, 10));

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
