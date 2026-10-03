import { z } from 'zod';
import { resourceService } from '../../services/resourceService.js';
import { reservationService } from '../../services/reservationService.js';
import { NotFoundError } from '../../utils/errors.js';

export const reservationRangeSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const createResourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(2, 'Type must be at least 2 characters'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  minDurationMinutes: z.coerce.number().int().min(5).default(15),
  maxDurationMinutes: z.coerce.number().int().min(5).default(240),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').default('09:00'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').default('17:00'),
});

export const updateResourceSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.string().min(2).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).optional(),
  minDurationMinutes: z.coerce.number().int().min(5).optional(),
  maxDurationMinutes: z.coerce.number().int().min(5).optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timezone: z.string().default('UTC'),
});

export async function listResources(req, res, next) {
  try {
    const result = await resourceService.listResources(req.user.organizationId, {
      ...req.query,
      userRole: req.user.role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getResource(req, res, next) {
  try {
    const resource = await resourceService.getResource(req.user.organizationId, req.params.id);
    if (req.user.role === 'MEMBER' && !resource.isActive) {
      throw new NotFoundError('Resource not found');
    }
    res.json(resource);
  } catch (err) {
    next(err);
  }
}

export async function createResource(req, res, next) {
  try {
    const resource = await resourceService.createResource(req.user.organizationId, req.body);
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
}

export async function updateResource(req, res, next) {
  try {
    const resource = await resourceService.updateResource(
      req.user.organizationId,
      req.params.id,
      req.body
    );
    res.json(resource);
  } catch (err) {
    next(err);
  }
}

export async function deactivateResource(req, res, next) {
  try {
    const resource = await resourceService.setResourceStatus(
      req.user.organizationId,
      req.params.id,
      false
    );
    res.json(resource);
  } catch (err) {
    next(err);
  }
}

export async function reactivateResource(req, res, next) {
  try {
    const resource = await resourceService.setResourceStatus(
      req.user.organizationId,
      req.params.id,
      true
    );
    res.json(resource);
  } catch (err) {
    next(err);
  }
}

export async function listResourceReservations(req, res, next) {
  try {
    const reservations = await reservationService.listForResource(
      req.user.organizationId,
      req.params.id,
      req.query
    );
    res.json({ data: reservations });
  } catch (err) {
    next(err);
  }
}

export async function getAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { date, timezone } = req.query;
    const availability = await resourceService.calculateAvailability(
      req.user.organizationId,
      id,
      date,
      timezone
    );
    res.json(availability);
  } catch (err) {
    next(err);
  }
}
