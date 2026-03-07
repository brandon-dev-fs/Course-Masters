import { Request, Response } from 'express';
import { courseService } from '../services/course.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const courseController = {
  getAll: asyncHandler(async (_req, res) => {
    const courses = await courseService.findAll();
    res.json(courses);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.findById(req.params['courseId'] as string);
    res.json(course);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.create(req.body);
    res.status(201).json(course);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.update(req.params['courseId'] as string, req.body);
    res.json(course);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await courseService.remove(req.params['courseId'] as string);
    res.status(204).send();
  }),
};
