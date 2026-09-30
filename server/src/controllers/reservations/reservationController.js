import { z } from 'zod';
import { reservationService } from '../../services/reservationService.js';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  resourceId: z.string().optional(),
  userId: z.string().optional(),
  upcomingOnly: z.enum(['true', 'false']).optional(),
});

export const createReservationSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
  startTime: z.string().datetime({ offset: true }, 'Must be a valid ISO 8601 datetime'),
  endTime: z.string().datetime({ offset: true }, 'Must be a valid ISO 8601 datetime'),
  notes: z.string().max(500).optional(),
});

export async function listReservations(req, res, next) {
  try {
    const result = await reservationService.listReservations(req.user.organizationId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createReservation(req, res, next) {
  try {
    const reservation = await reservationService.createReservation(
      req.user.organizationId,
      req.user.userId,
      req.body
    );
    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
}

export async function cancelReservation(req, res, next) {
  try {
    const reservation = await reservationService.cancelReservation(
      req.user.organizationId,
      req.user.userId,
      req.user.role,
      req.params.id
    );
    res.json(reservation);
  } catch (err) {
    next(err);
  }
}
