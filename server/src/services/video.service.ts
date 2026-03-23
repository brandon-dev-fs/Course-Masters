import prisma from '../lib/prisma.js';
import { createLessonContentService } from './factories/createLessonContentService.js';

export const videoService = createLessonContentService(prisma.video, 'Video');
