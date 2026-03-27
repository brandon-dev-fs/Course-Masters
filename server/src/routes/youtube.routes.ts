import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/index.js';

const youtubeUrlRegex = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;

const youtubeRouter = Router();

youtubeRouter.get(
  '/title',
  asyncHandler(async (req: Request, res: Response) => {
    const url = req.query['url'] as string | undefined;
    if (!url || !youtubeUrlRegex.test(url)) {
      throw new AppError('VALIDATION_ERROR', 'A valid YouTube URL is required', 422);
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new AppError('YOUTUBE_ERROR', 'Could not fetch video title', 422);
    }

    const data = (await response.json()) as { title: string };
    res.json({ title: data.title });
  }),
);

export default youtubeRouter;
