import { z } from 'zod';
import { banService } from '../../services/banService.js';

export const banSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  resourceType: z.string().min(1, 'Resource type is required'),
  reason: z.string().min(5, 'Please provide a reason (min 5 characters)'),
  bannedUntil: z.string().datetime({ offset: true }),
});

export const updateBanSchema = z.object({
  bannedUntil: z.string().datetime({ offset: true }),
  reason: z.string().min(5).optional(),
});

export async function listBans(req, res, next) {
  try {
    const bans = await banService.listBans(req.user.organizationId);
    res.json({ data: bans });
  } catch (err) {
    next(err);
  }
}

export async function banUser(req, res, next) {
  try {
    const ban = await banService.banUser(req.user.organizationId, req.user.userId, req.body);
    res.status(201).json(ban);
  } catch (err) {
    next(err);
  }
}

export async function unbanUser(req, res, next) {
  try {
    const { userId, resourceType } = req.params;
    await banService.unbanUser(req.user.organizationId, userId, resourceType);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function updateBan(req, res, next) {
  try {
    const { userId, resourceType } = req.params;
    const ban = await banService.updateBan(
      req.user.organizationId,
      userId,
      resourceType,
      req.body
    );
    res.json(ban);
  } catch (err) {
    next(err);
  }
}
export async function getMyBans(req, res, next) {
  try {
    const bans = await banService.getUserBans(req.user.organizationId, req.user.userId);
    res.json({ data: bans });
  } catch (err) {
    next(err);
  }
}
