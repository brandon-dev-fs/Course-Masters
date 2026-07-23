import { Request, Response } from 'express';

import { agentSessionService } from '../services/agent-session.service.js';
import { runAgentTurn } from '../services/agent-loop.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/index.js';
import { logger } from '../lib/logger.js';
import { MESSAGE_ACCEPTING_PHASES } from '../types/agent.js';
import type { SendMessageInput } from '../schemas/agent-session.schema.js';

export const agentSessionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const session = await agentSessionService.create(userId);
    res.status(201).json(session);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const sessions = await agentSessionService.list(userId);
    res.json(sessions);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const sessionId = req.params['sessionId'] as string;
    const session = await agentSessionService.getById(sessionId, userId);
    res.json(session);
  }),

  abandon: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const sessionId = req.params['sessionId'] as string;
    await agentSessionService.abandon(sessionId, userId);
    res.status(204).send();
  }),

  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const sessionId = req.params['sessionId'] as string;
    const { message } = req.body as SendMessageInput;

    // Load session (verifies ownership)
    const session = await agentSessionService.getById(sessionId, userId);

    // Guard: expired
    if (session.expired) {
      throw new AppError('SESSION_EXPIRED', 'This agent session has expired', 400);
    }

    // Guard: abandoned
    if (session.abandonedAt !== null) {
      throw new AppError('SESSION_ABANDONED', 'This agent session has been abandoned', 400);
    }

    // Guard: phase doesn't accept messages
    if (!(MESSAGE_ACCEPTING_PHASES as readonly string[]).includes(session.phase)) {
      throw new AppError(
        'PHASE_NOT_INTERACTIVE',
        `Cannot send messages during the ${session.phase} phase`,
        400,
      );
    }

    // Set SSE headers BEFORE writing
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Run agent loop — returns AsyncIterableStream<string>
    const stream = await runAgentTurn(sessionId, message);

    // Pipe ReadableStream to Express response
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (err) {
      logger.error({ err, sessionId }, 'Stream error during agent turn');
      if (!res.headersSent) {
        throw err;
      } else {
        res.end();
      }
    }
  }),
};
