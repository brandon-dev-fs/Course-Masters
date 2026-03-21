import { vocabService } from '../services/vocab.service.js';
import { createLessonContentController } from './factories/createLessonContentController.js';

export const vocabController = createLessonContentController(vocabService, 'vocabId');
