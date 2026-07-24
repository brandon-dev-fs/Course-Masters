import { tool } from 'ai';
import { z } from 'zod';

import type { Tool } from 'ai';

import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { ValidationError } from '../errors/index.js';
import { PHASE_SEQUENCE } from '../types/agent.js';
import type { AgentPhase } from '../types/agent.js';

// Phase-to-tool mapping
const PHASE_TOOL_NAMES: Record<AgentPhase, string[]> = {
  pre_load: [],
  elicitation: ['updateElicitationState', 'transitionPhase'],
  outline: ['transitionPhase'],
  curation: ['transitionPhase'],
  build: [],
  summary: [],
};

// Tool: updateElicitationState
function makeUpdateElicitationStateTool(sessionId: string) {
  return tool({
    description:
      'Update the elicitation state with newly gathered information. Performs a shallow merge into the existing state.',
    inputSchema: z.object({
      updates: z
        .record(z.unknown())
        .describe('Key-value pairs to merge into the elicitation state'),
    }),
    execute: async ({ updates }) => {
      const session = await prisma.agentSession.findFirst({
        where: { id: sessionId },
        select: { elicitationState: true },
      });
      if (!session) throw new Error('Session not found');

      const currentState = (session.elicitationState as Record<string, unknown>) ?? {};
      const updatedState = { ...currentState, ...updates };

      await prisma.agentSession.update({
        where: { id: sessionId },
        data: { elicitationState: updatedState as object },
      });

      logger.info({ sessionId, updatedKeys: Object.keys(updates) }, 'Elicitation state updated');
      return { success: true, state: updatedState };
    },
  });
}

// Tool: transitionPhase
function makeTransitionPhaseTool(
  sessionId: string,
  summarizePhase: (sessionId: string) => Promise<void>,
) {
  return tool({
    description:
      'Transition the agent session to the next phase. Only the immediate successor phase is accepted.',
    inputSchema: z.object({
      targetPhase: z
        .enum(['elicitation', 'outline', 'curation', 'build', 'summary'])
        .describe('The phase to transition to'),
    }),
    execute: async ({ targetPhase }) => {
      const session = await prisma.agentSession.findFirst({
        where: { id: sessionId },
        select: { phase: true },
      });
      if (!session) throw new Error('Session not found');

      const currentIndex = PHASE_SEQUENCE.indexOf(session.phase as AgentPhase);
      const targetIndex = PHASE_SEQUENCE.indexOf(targetPhase);

      if (targetIndex !== currentIndex + 1) {
        throw new ValidationError(
          `Invalid phase transition from ${session.phase} to ${targetPhase}. Only immediate successor transitions are allowed.`,
        );
      }

      // Summarize current phase conversation before transitioning
      await summarizePhase(sessionId);

      await prisma.agentSession.update({
        where: { id: sessionId },
        data: { phase: targetPhase },
      });

      logger.info(
        { sessionId, from: session.phase, to: targetPhase },
        'Phase transition completed',
      );
      return { previousPhase: session.phase, newPhase: targetPhase };
    },
  });
}

export function getToolsForPhase(
  phase: AgentPhase,
  sessionId: string,
  summarizePhase: (sessionId: string) => Promise<void>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, Tool<any, any, any>> {
  const enabledNames = PHASE_TOOL_NAMES[phase];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTools: Record<string, Tool<any, any, any>> = {
    updateElicitationState: makeUpdateElicitationStateTool(sessionId),
    transitionPhase: makeTransitionPhaseTool(sessionId, summarizePhase),
  };

  return Object.fromEntries(
    Object.entries(allTools).filter(([name]) => enabledNames.includes(name)),
  );
}
