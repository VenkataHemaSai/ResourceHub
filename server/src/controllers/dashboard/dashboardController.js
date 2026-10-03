import prisma from '../../utils/prisma.js';

export async function getDashboardStats(req, res, next) {
  try {
    const { organizationId } = req.user;
    const now = new Date();

    const [
      pendingAllocations,
      allocated,
      overdue,
      activeResources,
      activeSuspensions,
    ] = await Promise.all([
      prisma.reservation.count({
        where: { organizationId, status: 'PENDING_ALLOCATION' },
      }),
      prisma.reservation.count({
        where: { organizationId, status: 'ALLOCATED' },
      }),
      prisma.reservation.count({
        where: { organizationId, status: 'ALLOCATED', endTime: { lt: now } },
      }),
      prisma.resource.count({
        where: { organizationId, isActive: true },
      }),
      prisma.resourceBan.count({
        where: { organizationId, bannedUntil: { gte: now } },
      }),
    ]);

    res.json({
      pendingAllocations,
      allocated,
      overdue,
      activeResources,
      activeSuspensions,
    });
  } catch (err) {
    next(err);
  }
}
