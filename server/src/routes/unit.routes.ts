import { Router } from 'express';
import { unitController } from '../controllers/unit.controller.js';
import { validate } from '../middleware/validate.js';
import { createUnitSchema, updateUnitSchema } from '../schemas/unit.schema.js';

const router = Router({ mergeParams: true });

router.get('/', unitController.getAll);
router.post('/', validate(createUnitSchema), unitController.create);
router.get('/:unitId', unitController.getOne);
router.put('/:unitId', validate(updateUnitSchema), unitController.update);
router.delete('/:unitId', unitController.remove);

export default router;
