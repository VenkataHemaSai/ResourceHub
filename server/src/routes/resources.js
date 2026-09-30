import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { resourceService } from '../services/resourceService.js';

const router = Router();

// All resource routes require authentication
router.use(requireAuth);

// --- Validation Schemas ---
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

const createResourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(2, 'Type must be at least 2 characters'),
  description: z.string().optional(),
});

const updateResourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  type: z.string().min(2, 'Type must be at least 2 characters').optional(),
  description: z.string().optional(),
});

// --- Routes ---

// GET /api/v1/resources (List all resources)
router.get('/', validate(listQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await resourceService.listResources(req.user.organizationId, {
      ...req.query,
      userRole: req.user.role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/resources/:id (Get single resource)
router.get('/:id', async (req, res, next) => {
  try {
    const resource = await resourceService.getResource(req.user.organizationId, req.params.id);
    
    // Member cannot see inactive resource directly
    if (req.user.role === 'MEMBER' && !resource.isActive) {
      // Return 404 to hide its existence instead of 403
      const { NotFoundError } = await import('../lib/errors.js');
      throw new NotFoundError('Resource not found');
    }

    res.json(resource);
  } catch (err) {
    next(err);
  }
});

// Admin Only Routes Below
router.use(requireRole('ADMIN'));

// POST /api/v1/resources (Create resource)
router.post('/', validate(createResourceSchema), async (req, res, next) => {
  try {
    const resource = await resourceService.createResource(req.user.organizationId, req.body);
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/resources/:id (Update resource)
router.patch('/:id', validate(updateResourceSchema), async (req, res, next) => {
  try {
    const resource = await resourceService.updateResource(req.user.organizationId, req.params.id, req.body);
    res.json(resource);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/resources/:id/deactivate
router.post('/:id/deactivate', async (req, res, next) => {
  try {
    const resource = await resourceService.setResourceStatus(req.user.organizationId, req.params.id, false);
    res.json(resource);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/resources/:id/reactivate
router.post('/:id/reactivate', async (req, res, next) => {
  try {
    const resource = await resourceService.setResourceStatus(req.user.organizationId, req.params.id, true);
    res.json(resource);
  } catch (err) {
    next(err);
  }
});

export default router;
