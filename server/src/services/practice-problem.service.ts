import prisma from '../lib/prisma.js';
import { createLessonContentService } from './factories/createLessonContentService.js';

export const practiceProblemService = createLessonContentService(prisma.practiceProblem, 'Practice problem');
