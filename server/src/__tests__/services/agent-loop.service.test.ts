import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));
vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../lib/anthropic.js', () => ({
  anthropicProvider: vi.fn().mockReturnValue('mock-model-instance'),
  DEFAULT_MODEL: 'claude-sonnet-4-5-20251001',
}));
vi.mock('../../services/agent-prompt.service.js', () => ({
  buildSystemPrompt: vi.fn().mockReturnValue('system prompt'),
}));
vi.mock('../../services/agent-tools.js', () => ({
  getToolsForPhase: vi.fn().mockReturnValue({}),
}));
vi.mock('../../services/agent-memory.service.js', () => ({
  parseConversationLog: vi.fn().mockReturnValue({ messages: [], summary: '' }),
  appendMessages: vi.fn().mockResolvedValue(undefined),
  summarizePhase: vi.fn().mockResolvedValue(undefined),
}));

// vi.hoisted is required because vi.mock is hoisted; variables like
// mockStreamText would not yet be initialised when the factory runs.
const { mockStreamText, mockIsStepCount } = vi.hoisted(() => ({
  mockStreamText: vi.fn(),
  mockIsStepCount: vi.fn().mockReturnValue('step-count-5'),
}));
vi.mock('ai', () => ({ streamText: mockStreamText, isStepCount: mockIsStepCount }));

import { runAgentTurn } from '../../services/agent-loop.service.js';
import { buildSystemPrompt } from '../../services/agent-prompt.service.js';
import { getToolsForPhase } from '../../services/agent-tools.js';
import { parseConversationLog, appendMessages, summarizePhase } from '../../services/agent-memory.service.js';
import { NotFoundError } from '../../errors/index.js';

const mockBuildSystemPrompt = buildSystemPrompt as ReturnType<typeof vi.fn>;
const mockGetToolsForPhase = getToolsForPhase as ReturnType<typeof vi.fn>;
const mockParseConversationLog = parseConversationLog as ReturnType<typeof vi.fn>;
const mockAppendMessages = appendMessages as ReturnType<typeof vi.fn>;
const mockSummarizePhase = summarizePhase as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = 'session-1';
const USER_MESSAGE = 'What should I teach?';

function makeDbSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    phase: 'elicitation',
    elicitationState: null,
    conversationLog: null,
    ...overrides,
  };
}

function makeFakeStreamResult() {
  return { pipeUIMessageStreamToResponse: vi.fn() };
}

// ---------------------------------------------------------------------------
// runAgentTurn
// ---------------------------------------------------------------------------

describe('runAgentTurn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStreamText.mockReturnValue(makeFakeStreamResult());
    mockParseConversationLog.mockReturnValue({ messages: [], summary: '' });
    mockGetToolsForPhase.mockReturnValue({});
    mockBuildSystemPrompt.mockReturnValue('system prompt');
    mockIsStepCount.mockReturnValue('step-count-5');
  });

  it('throws NotFoundError when session does not exist', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(null);

    await expect(runAgentTurn(SESSION_ID, USER_MESSAGE)).rejects.toThrow(NotFoundError);
  });

  it('calls buildSystemPrompt with the session phase', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession({ phase: 'outline' }));

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    expect(mockBuildSystemPrompt).toHaveBeenCalledWith('outline');
  });

  it('calls parseConversationLog with session.conversationLog', async () => {
    const log = { messages: [], summary: '' };
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession({ conversationLog: log }));

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    expect(mockParseConversationLog).toHaveBeenCalledWith(log);
  });

  it('calls getToolsForPhase with phase, sessionId, and summarizePhase', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession({ phase: 'elicitation' }));

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    expect(mockGetToolsForPhase).toHaveBeenCalledWith(
      'elicitation',
      SESSION_ID,
      mockSummarizePhase,
    );
  });

  it('passes the system prompt and new user message to streamText', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession());
    mockBuildSystemPrompt.mockReturnValue('you are socrates');

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    const args = mockStreamText.mock.calls[0][0];
    expect(args.system).toContain('you are socrates');
    expect(args.messages).toContainEqual({ role: 'user', content: USER_MESSAGE });
  });

  it('prepends conversation history before the new user message', async () => {
    const history = [
      { role: 'user' as const, content: 'prev q', timestamp: 't1' },
      { role: 'assistant' as const, content: 'prev a', timestamp: 't2' },
    ];
    mockParseConversationLog.mockReturnValue({ messages: history, summary: '' });
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession());

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    const { messages } = mockStreamText.mock.calls[0][0];
    expect(messages[0]).toEqual({ role: 'user', content: 'prev q' });
    expect(messages[1]).toEqual({ role: 'assistant', content: 'prev a' });
    expect(messages[2]).toEqual({ role: 'user', content: USER_MESSAGE });
  });

  it('appends the summary to the system prompt when one exists', async () => {
    mockParseConversationLog.mockReturnValue({ messages: [], summary: 'prior context here' });
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession());

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    const { system } = mockStreamText.mock.calls[0][0];
    expect(system).toContain('prior context here');
  });

  it('does not include tools key when no tools are available for the phase', async () => {
    mockGetToolsForPhase.mockReturnValue({});
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession({ phase: 'build' }));

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    expect(mockStreamText.mock.calls[0][0]).not.toHaveProperty('tools');
  });

  it('includes tools key when tools are registered for the phase', async () => {
    mockGetToolsForPhase.mockReturnValue({ updateElicitationState: { execute: vi.fn() } });
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession({ phase: 'elicitation' }));

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    expect(mockStreamText.mock.calls[0][0]).toHaveProperty('tools');
  });

  it('passes isStepCount(5) as the stopWhen argument', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession());

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    expect(mockIsStepCount).toHaveBeenCalledWith(5);
    expect(mockStreamText.mock.calls[0][0].stopWhen).toBe('step-count-5');
  });

  it('returns the streamText result object', async () => {
    const fakeResult = makeFakeStreamResult();
    mockStreamText.mockReturnValue(fakeResult);
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession());

    const result = await runAgentTurn(SESSION_ID, USER_MESSAGE);

    expect(result).toBe(fakeResult);
  });

  it('onFinish callback persists user and assistant messages', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession());

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    const { onFinish } = mockStreamText.mock.calls[0][0];
    await onFinish({ text: 'assistant reply' });

    expect(mockAppendMessages).toHaveBeenCalledWith(
      SESSION_ID,
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: USER_MESSAGE }),
        expect.objectContaining({ role: 'assistant', content: 'assistant reply' }),
      ]),
    );
  });

  it('onFinish does not throw when appendMessages rejects', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(makeDbSession());
    mockAppendMessages.mockRejectedValueOnce(new Error('db error'));

    await runAgentTurn(SESSION_ID, USER_MESSAGE);

    const { onFinish } = mockStreamText.mock.calls[0][0];
    await expect(onFinish({ text: 'reply' })).resolves.toBeUndefined();
  });
});
