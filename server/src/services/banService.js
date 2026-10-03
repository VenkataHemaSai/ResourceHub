import prisma from '../utils/prisma.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { sendEmail, banNotificationEmail } from '../utils/email.js';

export const banService = {
  async banUser(organizationId, adminId, { userId, resourceType, reason, bannedUntil }) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    if (!user) throw new NotFoundError('User not found');

    const ban = await prisma.resourceBan.upsert({
      where: {
        organizationId_userId_resourceType: { organizationId, userId, resourceType },
      },
      update: { reason, bannedUntil: new Date(bannedUntil), bannedById: adminId },
      create: {
        organizationId,
        userId,
        resourceType,
        reason,
        bannedUntil: new Date(bannedUntil),
        bannedById: adminId,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    sendEmail({
      to: ban.user.email,
      ...banNotificationEmail({
        userName: ban.user.name,
        resourceType,
        bannedUntil: new Date(bannedUntil).toLocaleDateString(),
        reason,
      }),
    });

    return ban;
  },

  async unbanUser(organizationId, userId, resourceType) {
    const ban = await prisma.resourceBan.findUnique({
      where: {
        organizationId_userId_resourceType: { organizationId, userId, resourceType },
      },
    });

    if (!ban) throw new NotFoundError('Ban record not found');

    return prisma.resourceBan.delete({
      where: {
        organizationId_userId_resourceType: { organizationId, userId, resourceType },
      },
    });
  },

  async listBans(organizationId) {
    return prisma.resourceBan.findMany({
      where: { organizationId, bannedUntil: { gte: new Date() } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        bannedBy: { select: { name: true } },
      },
      orderBy: { bannedUntil: 'asc' },
    });
  },

  async getUserBans(organizationId, userId) {
    return prisma.resourceBan.findMany({
      where: {
        organizationId,
        userId,
        bannedUntil: { gte: new Date() },
      },
    });
  },

  async updateBan(organizationId, userId, resourceType, { bannedUntil, reason }) {
    const ban = await prisma.resourceBan.findUnique({
      where: {
        organizationId_userId_resourceType: { organizationId, userId, resourceType },
      },
    });

    if (!ban) throw new NotFoundError('Ban record not found');

    return prisma.resourceBan.update({
      where: {
        organizationId_userId_resourceType: { organizationId, userId, resourceType },
      },
      data: {
        bannedUntil: new Date(bannedUntil),
        ...(reason && { reason }),
      },
      include: { user: { select: { name: true, email: true } } },
    });
  },
};
