import type { AgentPhase } from '../types/agent.js';
import { ELICITATION_SYSTEM_PROMPT } from '../agent/prompts/elicitation.js';

const PHASE_INSTRUCTIONS: Record<AgentPhase, string> = {
  pre_load:
    'You are in the pre-load phase. Call getUserProfile immediately to load the learner\'s profile, then call transitionPhase to move to the elicitation phase. Do not wait for a user message.',
  elicitation: ELICITATION_SYSTEM_PROMPT,
  outline:
    'You are in the outline phase. Help the teacher structure their course into units and lessons with clear learning objectives.',
  curation:
    'You are in the curation phase. Help the teacher identify and organize resources for each lesson.',
  build: 'The course is being built. No user input is accepted in this phase.',
  summary: 'The course has been built. Present the summary to the teacher.',
};

export function buildSystemPrompt(phase: AgentPhase): string {
  const base =
    'You are Socrates, an expert course-building assistant. You help teachers design pedagogically effective courses on Course Masters.';
  return `${base}\n\n${PHASE_INSTRUCTIONS[phase]}`;
}
