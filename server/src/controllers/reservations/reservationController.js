import { z } from 'zod';
import { reservationService } from '../../services/reservationService.js';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z
    .enum(['PENDING_ALLOCATION', 'ALLOCATED', 'RETURNED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
});

export const createReservationSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  notes: z.string().max(500).optional(),
});

export const returnReservationSchema = z.object({
  adminNotes: z.string().max(1000).optional(),
});

export async function listMyReservations(req, res, next) {
  try {
    const result = await reservationService.listMine(
      req.user.organizationId,
      req.user.userId,
      req.query
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listAllReservations(req, res, next) {
  try {
    const result = await reservationService.listReservations(
      req.user.organizationId,
      req.query
    );
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

export async function allocateReservation(req, res, next) {
  try {
    const reservation = await reservationService.allocateReservation(
      req.user.organizationId,
      req.params.id
    );
    res.json(reservation);
  } catch (err) {
    next(err);
  }
}

export async function returnReservation(req, res, next) {
  try {
    const result = await reservationService.returnReservation(
      req.user.organizationId,
      req.params.id,
      req.body.adminNotes
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function markNoShow(req, res, next) {
  try {
    const reservation = await reservationService.markNoShow(
      req.user.organizationId,
      req.params.id
    );
    res.json(reservation);
  } catch (err) {
    next(err);
  }
}
