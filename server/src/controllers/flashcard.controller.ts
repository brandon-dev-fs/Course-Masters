import { flashCardService } from '../services/flashcard.service.js';
import { createLessonContentController } from './factories/createLessonContentController.js';

export const flashCardController = createLessonContentController(flashCardService, 'id');
