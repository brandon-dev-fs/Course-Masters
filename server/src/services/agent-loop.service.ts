import { streamText, isStepCount } from 'ai';

import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { NotFoundError } from '../errors/index.js';
import { anthropicProvider, DEFAULT_MODEL } from '../lib/anthropic.js';
import { buildSystemPrompt } from './agent-prompt.service.js';
import { getToolsForPhase } from './agent-tools.js';
import { parseConversationLog, appendMessages, summarizePhase } from './agent-memory.service.js';
import type { AgentPhase } from '../types/agent.js';

export async function runAgentTurn(
  sessionId: string,
  userMessage: string,
): Promise<ReturnType<typeof streamText>> {
  // 1. Load session from DB
  const session = await prisma.agentSession.findFirst({
    where: { id: sessionId },
    select: {
      id: true,
      phase: true,
      elicitationState: true,
      conversationLog: true,
    },
  });
  if (!session) throw new NotFoundError('Agent session not found');

  // 2. Build system prompt
  const systemPrompt = buildSystemPrompt(session.phase as AgentPhase);

  // 3. Reconstruct conversation context
  const conversationLog = parseConversationLog(session.conversationLog);
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Include rolling window messages
  for (const msg of conversationLog.messages) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add the new user message
  messages.push({ role: 'user', content: userMessage });

  // 4. Get phase-appropriate tools
  const tools = getToolsForPhase(session.phase as AgentPhase, sessionId, summarizePhase);
  const hasTools = Object.keys(tools).length > 0;

  // 5. Build system prompt with summary context if available
  const fullSystem = conversationLog.summary
    ? `${systemPrompt}\n\nPrevious conversation context:\n${conversationLog.summary}`
    : systemPrompt;

  // 6. Call streamText
  const result = streamText({
    model: anthropicProvider(DEFAULT_MODEL),
    system: fullSystem,
    messages,
    ...(hasTools ? { tools } : {}),
    stopWhen: isStepCount(5),
    onFinish: async ({ text }) => {
      try {
        const now = new Date().toISOString();
        await appendMessages(sessionId, [
          { role: 'user', content: userMessage, timestamp: now },
          { role: 'assistant', content: text, timestamp: now },
        ]);
        logger.info({ sessionId }, 'Agent turn completed and persisted');
      } catch (err) {
        logger.error({ err, sessionId }, 'Failed to persist conversation after turn');
      }
    },
  });

  // 7. Return the full StreamTextResult for SSE piping via pipeTextStreamToResponse
  return result;
}
