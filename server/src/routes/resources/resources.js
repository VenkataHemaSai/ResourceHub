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
  listResourceReservations,
  listQuerySchema,
  createResourceSchema,
  updateResourceSchema,
  reservationRangeSchema,
  getAvailability,
  availabilityQuerySchema,
} from '../../controllers/resources/resourceController.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listQuerySchema, 'query'), listResources);
router.get('/:id', getResource);
router.get('/:id/reservations', validate(reservationRangeSchema, 'query'), listResourceReservations);
router.get('/:id/availability', validate(availabilityQuerySchema, 'query'), getAvailability);

router.use(requireRole('ADMIN'));

router.post('/', validate(createResourceSchema), createResource);
router.patch('/:id', validate(updateResourceSchema), updateResource);
router.post('/:id/deactivate', deactivateResource);
router.post('/:id/reactivate', reactivateResource);

export default router;
