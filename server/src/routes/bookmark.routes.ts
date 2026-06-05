import { Router } from 'express';
import { bookmarkController } from '../controllers/bookmark.controller.js';
import { validate } from '../middleware/validate.js';
import { createBookmarkSchema, updateBookmarkSchema } from '../schemas/bookmark.schema.js';

// Inherits :assignmentId from the parent assignmentsRouter via mergeParams: true
export const bookmarkRouter = Router({ mergeParams: true });

bookmarkRouter.get('/', bookmarkController.getOne);
bookmarkRouter.post('/', validate(createBookmarkSchema), bookmarkController.create);
bookmarkRouter.put('/', validate(updateBookmarkSchema), bookmarkController.upsert);
bookmarkRouter.delete('/', bookmarkController.remove);
