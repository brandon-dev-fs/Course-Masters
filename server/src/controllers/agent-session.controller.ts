import { Request, Response } from 'express';

import { agentSessionService } from '../services/agent-session.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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
};
