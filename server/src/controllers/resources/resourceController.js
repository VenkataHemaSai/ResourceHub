import { z } from 'zod';
import { resourceService } from '../../services/resourceService.js';
import { NotFoundError } from '../../utils/errors.js';

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
});

export const updateResourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  type: z.string().min(2, 'Type must be at least 2 characters').optional(),
  description: z.string().optional(),
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
    const resource = await resourceService.updateResource(req.user.organizationId, req.params.id, req.body);
    res.json(resource);
  } catch (err) {
    next(err);
  }
}

export async function deactivateResource(req, res, next) {
  try {
    const resource = await resourceService.setResourceStatus(req.user.organizationId, req.params.id, false);
    res.json(resource);
  } catch (err) {
    next(err);
  }
}

export async function reactivateResource(req, res, next) {
  try {
    const resource = await resourceService.setResourceStatus(req.user.organizationId, req.params.id, true);
    res.json(resource);
  } catch (err) {
    next(err);
  }
}
