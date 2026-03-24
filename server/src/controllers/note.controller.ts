import { noteService } from '../services/note.service.js';
import { createLessonContentController } from './factories/createLessonContentController.js';

export const noteController = createLessonContentController(noteService, 'noteId');
