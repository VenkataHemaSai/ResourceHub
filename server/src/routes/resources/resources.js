import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
  listResources,
  getResource,
  createResource,
  updateResource,
  deactivateResource,
  reactivateResource,
  listQuerySchema,
  createResourceSchema,
  updateResourceSchema,
} from '../../controllers/resources/resourceController.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listQuerySchema, 'query'), listResources);
router.get('/:id', getResource);

router.use(requireRole('ADMIN'));

router.post('/', validate(createResourceSchema), createResource);
router.patch('/:id', validate(updateResourceSchema), updateResource);
router.post('/:id/deactivate', deactivateResource);
router.post('/:id/reactivate', reactivateResource);

export default router;
