import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

/**
 * DELETE /api/users/:userId
 *
 * Soft-delete a user and cascade to all their Courses, Units, Lessons,
 * and Assessments. Admin-only. See api-contract.md (cm-0018).
 */
router.delete('/:userId', authorize('admin'), userController.remove);

export default router;
