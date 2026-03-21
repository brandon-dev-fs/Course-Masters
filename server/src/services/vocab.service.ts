import prisma from '../lib/prisma.js';
import { createLessonContentService } from './factories/createLessonContentService.js';

export const vocabService = createLessonContentService(prisma.vocab, 'Vocab');
