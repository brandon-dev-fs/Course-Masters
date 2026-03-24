import prisma from '../lib/prisma.js';
import { createLessonContentService } from './factories/createLessonContentService.js';

export const noteService = createLessonContentService(prisma.note, 'Note');
