import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  listReservations,
  createReservation,
  cancelReservation,
  listQuerySchema,
  createReservationSchema,
} from '../../controllers/reservations/reservationController.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listQuerySchema, 'query'), listReservations);
router.post('/', validate(createReservationSchema), createReservation);
router.post('/:id/cancel', cancelReservation);

export default router;
