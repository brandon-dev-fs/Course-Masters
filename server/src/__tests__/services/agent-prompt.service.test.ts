import { describe, it, expect } from 'vitest';

import { buildSystemPrompt } from '../../services/agent-prompt.service.js';
import type { AgentPhase } from '../../types/agent.js';

const ALL_PHASES: AgentPhase[] = [
  'pre_load',
  'elicitation',
  'outline',
  'curation',
  'build',
  'summary',
];

describe('buildSystemPrompt', () => {
  it('includes the Socrates persona in every phase', () => {
    for (const phase of ALL_PHASES) {
      expect(buildSystemPrompt(phase)).toContain('Socrates');
    }
  });

  it('includes the base course-building description in every phase', () => {
    for (const phase of ALL_PHASES) {
      expect(buildSystemPrompt(phase)).toContain('course-building assistant');
    }
  });

  it('returns a non-empty string for every phase', () => {
    for (const phase of ALL_PHASES) {
      expect(buildSystemPrompt(phase).length).toBeGreaterThan(0);
    }
  });

  it('includes pre-load context for pre_load phase', () => {
    expect(buildSystemPrompt('pre_load')).toContain('pre-load');
  });

  it('includes elicitation context for elicitation phase', () => {
    expect(buildSystemPrompt('elicitation')).toContain('elicitation');
  });

  it('includes outline context for outline phase', () => {
    expect(buildSystemPrompt('outline')).toContain('outline');
  });

  it('includes curation context for curation phase', () => {
    expect(buildSystemPrompt('curation')).toContain('curation');
  });

  it('includes build context for build phase', () => {
    expect(buildSystemPrompt('build')).toContain('build');
  });

  it('includes summary context for summary phase', () => {
    expect(buildSystemPrompt('summary')).toContain('summary');
  });

  it('produces distinct prompts for different phases', () => {
    const elicitation = buildSystemPrompt('elicitation');
    const outline = buildSystemPrompt('outline');
    expect(elicitation).not.toBe(outline);
  });
});
