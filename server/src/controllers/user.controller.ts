import { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await userService.getMe(userId);
    res.json(profile);
  }),

  updatePreferences: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await userService.updatePreferences(userId, req.body);
    res.json(result);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await userService.remove(req.params['userId'] as string);
    res.status(204).send();
  }),
};
