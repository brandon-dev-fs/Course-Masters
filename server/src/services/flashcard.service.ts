import prisma from '../lib/prisma.js';
import { createLessonContentService } from './factories/createLessonContentService.js';

export const flashCardService = createLessonContentService(prisma.flashCard, 'Flash card');
