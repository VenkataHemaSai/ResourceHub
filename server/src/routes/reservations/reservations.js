import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
  listMyReservations,
  listAllReservations,
  createReservation,
  cancelReservation,
  listQuerySchema,
  createReservationSchema,
} from '../../controllers/reservations/reservationController.js';

const router = Router();

router.use(requireAuth);

router.get('/mine', validate(listQuerySchema, 'query'), listMyReservations);
router.post('/', validate(createReservationSchema), createReservation);
router.post('/:id/cancel', cancelReservation);

router.get('/', requireRole('ADMIN'), validate(listQuerySchema, 'query'), listAllReservations);

export default router;
