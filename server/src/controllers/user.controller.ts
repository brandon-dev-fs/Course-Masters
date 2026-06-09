import { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userController = {
  remove: asyncHandler(async (req: Request, res: Response) => {
    await userService.remove(req.params['userId'] as string);
    res.status(204).send();
  }),
};
