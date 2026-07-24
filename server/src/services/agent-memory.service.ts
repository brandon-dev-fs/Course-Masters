import { generateText } from 'ai';

import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { anthropicProvider, DEFAULT_MODEL } from '../lib/anthropic.js';
import type { ConversationLog, ConversationMessage } from '../types/agent.js';
import { MAX_CONVERSATION_WINDOW } from '../types/agent.js';

export function parseConversationLog(raw: unknown): ConversationLog {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'messages' in raw &&
    Array.isArray((raw as Record<string, unknown>)['messages'])
  ) {
    return raw as ConversationLog;
  }
  return { messages: [], summary: '' };
}

async function generateSummary(
  messages: ConversationMessage[],
  existingSummary: string,
): Promise<string> {
  const formattedMessages = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

  let prompt =
    'Summarize the following conversation concisely, preserving key decisions, requirements, and important context. Write in past tense as a brief paragraph.';
  if (existingSummary) {
    prompt += `\n\nPrevious context: ${existingSummary}`;
  }
  prompt += `\n\nConversation:\n${formattedMessages}`;

  if (!anthropicProvider) {
    throw new Error('AI agent is not enabled. Set ENABLE_AI_AGENT=true and ANTHROPIC_API_KEY.');
  }

  const result = await generateText({
    model: anthropicProvider(DEFAULT_MODEL),
    prompt,
    maxOutputTokens: 500,
  });

  return result.text;
}

export async function appendMessages(
  sessionId: string,
  messages: ConversationMessage[],
): Promise<void> {
  const session = await prisma.agentSession.findFirst({
    where: { id: sessionId },
    select: { conversationLog: true },
  });
  if (!session) return;

  const log = parseConversationLog(session.conversationLog);
  log.messages.push(...messages);

  if (log.messages.length > MAX_CONVERSATION_WINDOW) {
    await trimConversation(sessionId, log);
    return;
  }

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { conversationLog: log as object },
  });
}

async function trimConversation(sessionId: string, log: ConversationLog): Promise<void> {
  const overflow = log.messages.length - MAX_CONVERSATION_WINDOW;
  const toSummarize = log.messages.slice(0, overflow);
  const remaining = log.messages.slice(overflow);

  const newSummary = await generateSummary(toSummarize, log.summary);

  const updatedLog: ConversationLog = { messages: remaining, summary: newSummary };

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { conversationLog: updatedLog as object },
  });

  logger.info({ sessionId, summarizedCount: toSummarize.length }, 'Conversation window trimmed');
}

export async function summarizePhase(sessionId: string): Promise<void> {
  const session = await prisma.agentSession.findFirst({
    where: { id: sessionId },
    select: { conversationLog: true, phase: true },
  });
  if (!session) return;

  const log = parseConversationLog(session.conversationLog);
  if (log.messages.length === 0) return;

  const newSummary = await generateSummary(log.messages, log.summary);
  const updatedLog: ConversationLog = { messages: [], summary: newSummary };

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { conversationLog: updatedLog as object },
  });

  logger.info({ sessionId, phase: session.phase }, 'Phase conversation summarized');
}
