import { describe, it, expect } from 'vitest';

import {
  PHASE_SEQUENCE,
  MESSAGE_ACCEPTING_PHASES,
  MAX_CONVERSATION_WINDOW,
} from '../../types/agent.js';

describe('PHASE_SEQUENCE', () => {
  it('contains all six phases in order', () => {
    expect(PHASE_SEQUENCE).toEqual([
      'pre_load',
      'elicitation',
      'outline',
      'curation',
      'build',
      'summary',
    ]);
  });

  it('starts with pre_load', () => {
    expect(PHASE_SEQUENCE[0]).toBe('pre_load');
  });

  it('ends with summary', () => {
    expect(PHASE_SEQUENCE[PHASE_SEQUENCE.length - 1]).toBe('summary');
  });

  it('has exactly six phases', () => {
    expect(PHASE_SEQUENCE).toHaveLength(6);
  });
});

describe('MESSAGE_ACCEPTING_PHASES', () => {
  it('includes pre_load', () => {
    expect(MESSAGE_ACCEPTING_PHASES).toContain('pre_load');
  });

  it('includes elicitation', () => {
    expect(MESSAGE_ACCEPTING_PHASES).toContain('elicitation');
  });

  it('includes outline', () => {
    expect(MESSAGE_ACCEPTING_PHASES).toContain('outline');
  });

  it('includes curation', () => {
    expect(MESSAGE_ACCEPTING_PHASES).toContain('curation');
  });

  it('does not include build', () => {
    expect(MESSAGE_ACCEPTING_PHASES).not.toContain('build');
  });

  it('does not include summary', () => {
    expect(MESSAGE_ACCEPTING_PHASES).not.toContain('summary');
  });
});

describe('MAX_CONVERSATION_WINDOW', () => {
  it('equals 20', () => {
    expect(MAX_CONVERSATION_WINDOW).toBe(20);
  });
});
