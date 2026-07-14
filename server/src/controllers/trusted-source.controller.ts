import { Request, Response } from 'express';

import { trustedSourceService } from '../services/trusted-source.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import type { TrustedSourceQuery } from '../schemas/trusted-source.schema.js';

export const trustedSourceController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const query = res.locals['validatedQuery'] as TrustedSourceQuery;
    const sources = await trustedSourceService.list(query);
    res.json(sources);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const source = await trustedSourceService.create(req.body);
    res.status(201).json(source);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const sourceId = req.params['sourceId'] as string;
    const source = await trustedSourceService.update(sourceId, req.body);
    res.json(source);
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const sourceId = req.params['sourceId'] as string;
    await trustedSourceService.deactivate(sourceId);
    res.status(204).send();
  }),
};
