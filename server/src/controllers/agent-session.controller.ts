import { Request, Response } from 'express';

import { agentSessionService } from '../services/agent-session.service.js';
import { runAgentTurn } from '../services/agent-loop.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/index.js';
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

    // Guard: phase doesn't accept messages
    if (!(MESSAGE_ACCEPTING_PHASES as readonly string[]).includes(session.phase)) {
      throw new AppError(
        'PHASE_NOT_INTERACTIVE',
        `Cannot send messages during the ${session.phase} phase`,
        400,
      );
    }

    // Disable nginx proxy buffering for SSE
    res.setHeader('X-Accel-Buffering', 'no');

    // Run agent loop — returns StreamTextResult
    const result = await runAgentTurn(sessionId, message);

    // SDK handles SSE headers (Content-Type, Cache-Control), streaming, and lifecycle
    await result.pipeTextStreamToResponse(res);
  }),
};
