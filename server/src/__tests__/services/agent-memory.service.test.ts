import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));
vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../lib/anthropic.js', () => ({
  anthropicProvider: vi.fn().mockReturnValue({}),
  DEFAULT_MODEL: 'claude-sonnet-4-5-20251001',
}));

// vi.hoisted ensures mockGenerateText is available inside the vi.mock factory.
const mockGenerateText = vi.hoisted(() => vi.fn());
vi.mock('ai', () => ({ generateText: mockGenerateText }));

import {
  parseConversationLog,
  appendMessages,
  summarizePhase,
} from '../../services/agent-memory.service.js';
import type { ConversationMessage } from '../../types/agent.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = 'session-1';

function makeMessage(
  role: 'user' | 'assistant' = 'user',
  content = 'hello',
): ConversationMessage {
  return { role, content, timestamp: '2024-01-01T00:00:00.000Z' };
}

function makeLog(messages: ConversationMessage[], summary = '') {
  return { messages, summary };
}

// ---------------------------------------------------------------------------
// parseConversationLog
// ---------------------------------------------------------------------------

describe('parseConversationLog', () => {
  it('returns empty log for null', () => {
    expect(parseConversationLog(null)).toEqual({ messages: [], summary: '' });
  });

  it('returns empty log for undefined', () => {
    expect(parseConversationLog(undefined)).toEqual({ messages: [], summary: '' });
  });

  it('returns empty log for a string', () => {
    expect(parseConversationLog('bad')).toEqual({ messages: [], summary: '' });
  });

  it('returns empty log for an object missing messages', () => {
    expect(parseConversationLog({ summary: 'hi' })).toEqual({ messages: [], summary: '' });
  });

  it('returns empty log when messages is not an array', () => {
    expect(parseConversationLog({ messages: 'not-array', summary: '' })).toEqual({
      messages: [],
      summary: '',
    });
  });

  it('returns the log as-is for a valid ConversationLog', () => {
    const log = makeLog([makeMessage()], 'existing summary');
    expect(parseConversationLog(log)).toEqual(log);
  });

  it('returns a log with an empty messages array', () => {
    const log = makeLog([], '');
    expect(parseConversationLog(log)).toEqual(log);
  });
});

// ---------------------------------------------------------------------------
// appendMessages
// ---------------------------------------------------------------------------

describe('appendMessages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is a no-op when session is not found', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(null);

    await appendMessages(SESSION_ID, [makeMessage()]);

    expect(prismaMock.agentSession.update).not.toHaveBeenCalled();
  });

  it('appends messages and saves when within the window limit', async () => {
    const existing = makeLog([makeMessage('user', 'first')]);
    prismaMock.agentSession.findFirst.mockResolvedValue({ conversationLog: existing });
    prismaMock.agentSession.update.mockResolvedValue({});

    const newMsg = makeMessage('assistant', 'reply');
    await appendMessages(SESSION_ID, [newMsg]);

    expect(prismaMock.agentSession.update).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: {
        conversationLog: {
          messages: [makeMessage('user', 'first'), newMsg],
          summary: '',
        },
      },
    });
  });

  it('initiates trimming when messages exceed MAX_CONVERSATION_WINDOW', async () => {
    const existing = makeLog(
      Array.from({ length: 20 }, (_, i) => makeMessage('user', `msg ${i}`)),
    );
    prismaMock.agentSession.findFirst.mockResolvedValue({ conversationLog: existing });
    prismaMock.agentSession.update.mockResolvedValue({});
    mockGenerateText.mockResolvedValue({ text: 'summary of old messages' });

    await appendMessages(SESSION_ID, [makeMessage('assistant', 'overflow reply')]);

    expect(mockGenerateText).toHaveBeenCalled();
    expect(prismaMock.agentSession.update).toHaveBeenCalled();
    const saved = prismaMock.agentSession.update.mock.calls[0][0].data.conversationLog;
    expect(saved.summary).toBe('summary of old messages');
    expect(saved.messages.length).toBeLessThanOrEqual(20);
  });

  it('initialises an empty log when conversationLog is null', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({ conversationLog: null });
    prismaMock.agentSession.update.mockResolvedValue({});

    const msg = makeMessage('user', 'first message');
    await appendMessages(SESSION_ID, [msg]);

    expect(prismaMock.agentSession.update).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: { conversationLog: { messages: [msg], summary: '' } },
    });
  });
});

// ---------------------------------------------------------------------------
// summarizePhase
// ---------------------------------------------------------------------------

describe('summarizePhase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is a no-op when session is not found', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(null);

    await summarizePhase(SESSION_ID);

    expect(mockGenerateText).not.toHaveBeenCalled();
    expect(prismaMock.agentSession.update).not.toHaveBeenCalled();
  });

  it('is a no-op when the conversation log has no messages', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({
      conversationLog: makeLog([]),
      phase: 'elicitation',
    });

    await summarizePhase(SESSION_ID);

    expect(mockGenerateText).not.toHaveBeenCalled();
    expect(prismaMock.agentSession.update).not.toHaveBeenCalled();
  });

  it('generates a summary and clears messages', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({
      conversationLog: makeLog([makeMessage('user', 'hi'), makeMessage('assistant', 'hello')]),
      phase: 'elicitation',
    });
    prismaMock.agentSession.update.mockResolvedValue({});
    mockGenerateText.mockResolvedValue({ text: 'phase summary' });

    await summarizePhase(SESSION_ID);

    expect(mockGenerateText).toHaveBeenCalledOnce();
    expect(prismaMock.agentSession.update).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: { conversationLog: { messages: [], summary: 'phase summary' } },
    });
  });

  it('includes existing summary in the prompt for context', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({
      conversationLog: makeLog([makeMessage()], 'previous summary'),
      phase: 'outline',
    });
    prismaMock.agentSession.update.mockResolvedValue({});
    mockGenerateText.mockResolvedValue({ text: 'new summary' });

    await summarizePhase(SESSION_ID);

    const promptArg = mockGenerateText.mock.calls[0][0].prompt as string;
    expect(promptArg).toContain('previous summary');
  });
});
