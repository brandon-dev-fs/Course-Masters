import { Request, Response } from 'express';
import { assignmentService } from '../services/assignment.service.js';
import { logger } from '../lib/logger.js';
import { ValidationError } from '../errors/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const assignmentController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const userId = req.user!.id;
    res.json(await assignmentService.findAllByLesson(lessonId, userId));
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    const userId = req.user!.id;
    res.json(await assignmentService.findById(assignmentId, userId));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    res.status(201).json(await assignmentService.create(lessonId, req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    res.json(await assignmentService.update(assignmentId, req.body));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    await assignmentService.remove(assignmentId);
    res.status(204).send();
  }),

  reorder: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    res.json(await assignmentService.reorder(lessonId, req.body.assignmentIds));
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    const userId = req.user!.id;
    res.status(201).json(await assignmentService.markComplete(assignmentId, userId));
  }),

  uncomplete: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    const userId = req.user!.id;
    await assignmentService.markIncomplete(assignmentId, userId);
    res.status(204).send();
  }),

  getSavedVocabEntryFlashCards: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const userId = req.user!.id;
    res.json(await assignmentService.getSavedVocabEntryFlashCards(lessonId, userId));
  }),

  saveVocabEntryFlashCard: asyncHandler(async (req: Request, res: Response) => {
    const entryId = req.params['entryId'] as string;
    const userId = req.user!.id;
    res.status(201).json(await assignmentService.saveVocabEntryFlashCard(entryId, userId));
  }),

  removeVocabEntryFlashCard: asyncHandler(async (req: Request, res: Response) => {
    const entryId = req.params['entryId'] as string;
    const userId = req.user!.id;
    await assignmentService.removeVocabEntryFlashCard(entryId, userId);
    res.status(204).send();
  }),

  uploadFile: asyncHandler(async (req: Request, res: Response) => {
    const lessonId = req.params['lessonId'] as string;
    const { title, objective } = req.body as { title?: string; objective?: string };

    if (!title || title.trim() === '') {
      throw new ValidationError('title is required', { title: ['title is required'] });
    }
    if (!req.file) {
      throw new ValidationError('file is required', { file: ['file is required'] });
    }

    const assignment = await assignmentService.createFileAssignment(lessonId, {
      title: title.trim(),
      objective,
      file: req.file,
    });

    res.status(201).json(assignment);
  }),

  downloadFile: asyncHandler(async (req: Request, res: Response) => {
    const assignmentId = req.params['assignmentId'] as string;
    const { stream, filename, mimeType, sizeBytes } = await assignmentService.getFileStream(assignmentId);

    const encodedFilename = encodeURIComponent(filename);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Length', String(sizeBytes));

    stream.on('error', (streamErr) => {
      logger.error({ assignmentId, streamErr }, 'S3 stream error during file download');
      res.destroy();
    });

    stream.pipe(res);
  }),
};
