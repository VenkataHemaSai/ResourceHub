import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
  listMyReservations,
  listAllReservations,
  createReservation,
  cancelReservation,
  allocateReservation,
  returnReservation,
  markNoShow,
  createReservationSchema,
  listQuerySchema,
  returnReservationSchema,
} from '../../controllers/reservations/reservationController.js';

const router = Router();

router.use(requireAuth);

router.get('/mine', validate(listQuerySchema, 'query'), listMyReservations);
router.post('/', validate(createReservationSchema), createReservation);
router.post('/:id/cancel', cancelReservation);

router.use(requireRole('ADMIN'));

router.get('/', validate(listQuerySchema, 'query'), listAllReservations);
router.post('/:id/allocate', allocateReservation);
router.post('/:id/return', validate(returnReservationSchema), returnReservation);
router.post('/:id/no-show', markNoShow);

export default router;
