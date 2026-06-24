import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { updatePreferencesSchema } from '../schemas/user.schema.js';

const router = Router();

/**
 * GET /api/users/me
 *
 * Returns the authenticated user's profile including theme preference.
 * No role restriction — all authenticated users. See api-contract.md (cm-0032).
 */
router.get('/me', userController.getMe);

/**
 * PATCH /api/users/me/preferences
 *
 * Updates the authenticated user's theme preference.
 * No role restriction — all authenticated users. See api-contract.md (cm-0032).
 */
router.patch('/me/preferences', validate(updatePreferencesSchema), userController.updatePreferences);

/**
 * DELETE /api/users/:userId
 *
 * Soft-delete a user and cascade to all their Courses, Units, Lessons,
 * and Assessments. Admin-only. See api-contract.md (cm-0018).
 */
router.delete('/:userId', authorize('admin'), userController.remove);

export default router;
