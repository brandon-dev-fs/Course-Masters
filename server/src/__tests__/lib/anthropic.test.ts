import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../../config.js', () => ({
  config: { ANTHROPIC_API_KEY: 'test-api-key' },
}));

// vi.hoisted ensures mockProvider and mockCreateAnthropic are available inside
// the vi.mock factory before the factory is executed.
// calledWithArg is stored in a closure so clearMocks: true cannot wipe it —
// clearMocks resets mock internals (calls/instances/results) but not plain
// variables captured in closures.
const { mockProvider, mockCreateAnthropic, getCalledWithArg } = vi.hoisted(() => {
  const mockProvider = vi.fn();
  let calledWithArg: unknown;
  const mockCreateAnthropic = vi.fn().mockImplementation((arg: unknown) => {
    calledWithArg = arg;
    return mockProvider;
  });
  return {
    mockProvider,
    mockCreateAnthropic,
    getCalledWithArg: () => calledWithArg,
  };
});

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: mockCreateAnthropic,
}));

import { anthropicProvider, DEFAULT_MODEL } from '../../lib/anthropic.js';

describe('anthropicProvider', () => {
  it('is created via createAnthropic with the config API key', () => {
    // anthropic.ts calls createAnthropic() at module load time.
    // We verify the captured arg rather than mock.calls (which clearMocks wipes).
    expect(getCalledWithArg()).toEqual({ apiKey: 'test-api-key' });
  });

  it('is the value returned by createAnthropic', () => {
    expect(anthropicProvider).toBe(mockProvider);
  });
});

describe('DEFAULT_MODEL', () => {
  it('exports the expected model identifier', () => {
    expect(DEFAULT_MODEL).toBe('claude-sonnet-4-5-20251001');
  });
});
