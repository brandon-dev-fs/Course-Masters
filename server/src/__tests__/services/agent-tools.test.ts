import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));
vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Let tool() act as an identity so we can call execute() directly in tests.
vi.mock('ai', () => ({
  tool: vi.fn().mockImplementation((config) => config),
}));

import { getToolsForPhase } from '../../services/agent-tools.js';
import { ValidationError } from '../../errors/index.js';
import type { AgentPhase } from '../../types/agent.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = 'session-1';
const mockSummarizePhase = vi.fn().mockResolvedValue(undefined);

function getTools(phase: AgentPhase) {
  return getToolsForPhase(phase, SESSION_ID, mockSummarizePhase);
}

// ---------------------------------------------------------------------------
// getToolsForPhase — phase-to-tool mapping
// ---------------------------------------------------------------------------

describe('getToolsForPhase — tool registration', () => {
  it('returns no tools for pre_load phase', () => {
    expect(Object.keys(getTools('pre_load'))).toHaveLength(0);
  });

  it('returns no tools for build phase', () => {
    expect(Object.keys(getTools('build'))).toHaveLength(0);
  });

  it('returns no tools for summary phase', () => {
    expect(Object.keys(getTools('summary'))).toHaveLength(0);
  });

  it('returns updateElicitationState and transitionPhase for elicitation', () => {
    const tools = getTools('elicitation');
    expect(Object.keys(tools)).toContain('updateElicitationState');
    expect(Object.keys(tools)).toContain('transitionPhase');
    expect(Object.keys(tools)).toHaveLength(2);
  });

  it('returns only transitionPhase for outline', () => {
    const tools = getTools('outline');
    expect(Object.keys(tools)).toEqual(['transitionPhase']);
  });

  it('returns only transitionPhase for curation', () => {
    const tools = getTools('curation');
    expect(Object.keys(tools)).toEqual(['transitionPhase']);
  });
});

// ---------------------------------------------------------------------------
// updateElicitationState — execute
// ---------------------------------------------------------------------------

describe('updateElicitationState tool', () => {
  beforeEach(() => vi.clearAllMocks());

  function getUpdateTool() {
    return getTools('elicitation')['updateElicitationState'] as {
      execute: (args: { updates: Record<string, unknown> }) => Promise<unknown>;
    };
  }

  it('throws when session is not found', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(null);

    await expect(getUpdateTool().execute({ updates: { topic: 'math' } })).rejects.toThrow(
      'Session not found',
    );
  });

  it('shallow-merges updates into existing elicitation state', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({
      elicitationState: { topic: 'science', audience: 'beginners' },
    });
    prismaMock.agentSession.update.mockResolvedValue({});

    await getUpdateTool().execute({ updates: { topic: 'math', level: 'advanced' } });

    expect(prismaMock.agentSession.update).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: {
        elicitationState: { topic: 'math', audience: 'beginners', level: 'advanced' },
      },
    });
  });

  it('initialises state from empty when elicitationState is null', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({ elicitationState: null });
    prismaMock.agentSession.update.mockResolvedValue({});

    await getUpdateTool().execute({ updates: { topic: 'history' } });

    expect(prismaMock.agentSession.update).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: { elicitationState: { topic: 'history' } },
    });
  });

  it('returns success and the merged state', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({ elicitationState: {} });
    prismaMock.agentSession.update.mockResolvedValue({});

    const result = await getUpdateTool().execute({ updates: { topic: 'art' } }) as {
      success: boolean;
      state: Record<string, unknown>;
    };

    expect(result.success).toBe(true);
    expect(result.state).toMatchObject({ topic: 'art' });
  });
});

// ---------------------------------------------------------------------------
// transitionPhase — execute
// ---------------------------------------------------------------------------

describe('transitionPhase tool', () => {
  beforeEach(() => vi.clearAllMocks());

  function getTransitionTool(phase: AgentPhase = 'elicitation') {
    return getTools(phase)['transitionPhase'] as {
      execute: (args: { targetPhase: string }) => Promise<unknown>;
    };
  }

  it('throws when session is not found', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue(null);

    await expect(getTransitionTool().execute({ targetPhase: 'outline' })).rejects.toThrow(
      'Session not found',
    );
  });

  it('throws ValidationError for a non-sequential phase jump', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({ phase: 'elicitation' });

    await expect(getTransitionTool().execute({ targetPhase: 'curation' })).rejects.toThrow(
      ValidationError,
    );
  });

  it('throws ValidationError when transitioning to the same phase', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({ phase: 'elicitation' });

    await expect(getTransitionTool().execute({ targetPhase: 'elicitation' })).rejects.toThrow(
      ValidationError,
    );
  });

  it('calls summarizePhase before updating the phase', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({ phase: 'elicitation' });
    prismaMock.agentSession.update.mockResolvedValue({});

    await getTransitionTool().execute({ targetPhase: 'outline' });

    expect(mockSummarizePhase).toHaveBeenCalledWith(SESSION_ID);
    expect(prismaMock.agentSession.update).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: { phase: 'outline' },
    });
  });

  it('returns previous and new phase on success', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({ phase: 'elicitation' });
    prismaMock.agentSession.update.mockResolvedValue({});

    const result = await getTransitionTool().execute({ targetPhase: 'outline' }) as {
      previousPhase: string;
      newPhase: string;
    };

    expect(result.previousPhase).toBe('elicitation');
    expect(result.newPhase).toBe('outline');
  });

  it('allows outline → curation transition', async () => {
    prismaMock.agentSession.findFirst.mockResolvedValue({ phase: 'outline' });
    prismaMock.agentSession.update.mockResolvedValue({});

    const result = await getTransitionTool('outline').execute({ targetPhase: 'curation' }) as {
      newPhase: string;
    };

    expect(result.newPhase).toBe('curation');
  });
});
