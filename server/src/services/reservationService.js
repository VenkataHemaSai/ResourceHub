import prisma from '../utils/prisma.js';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../utils/errors.js';

const BUFFER_MINUTES = 15;
const MAX_UPCOMING_BOOKINGS = 3;
const MAX_PER_RESOURCE_TYPE_PER_DAY = 2;
const MAX_PER_RESOURCE_TYPE_PER_MONTH = 8;

function parseHHMM(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export const reservationService = {
  async createReservation(organizationId, userId, data) {
    const { resourceId, startTime, endTime, notes } = data;

    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, organizationId },
    });

    if (!resource) throw new NotFoundError('Resource not found');
    if (!resource.isActive) throw new ForbiddenError('Cannot book an inactive resource');

    const activeBan = await prisma.resourceBan.findUnique({
      where: {
        organizationId_userId_resourceType: {
          organizationId,
          userId,
          resourceType: resource.type,
        },
      },
    });

    if (activeBan && new Date(activeBan.bannedUntil) > new Date()) {
      throw new ForbiddenError(
        `You are suspended from booking ${resource.type} resources until ${new Date(activeBan.bannedUntil).toLocaleDateString()}. Reason: ${activeBan.reason}`
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) throw new ValidationError({ endTime: 'End time must be after start time' });

    const durationMs = end - start;
    const durationMinutes = durationMs / (60 * 1000);

    if (durationMinutes < resource.minDurationMinutes) {
      throw new ValidationError({
        endTime: `Minimum booking duration is ${resource.minDurationMinutes} minutes`,
      });
    }

    if (durationMinutes > resource.maxDurationMinutes) {
      throw new ValidationError({
        endTime: `Maximum booking duration is ${resource.maxDurationMinutes} minutes`,
      });
    }

    const openMinutes = parseHHMM(resource.openTime);
    const closeMinutes = parseHHMM(resource.closeTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    if (startMinutes < openMinutes || startMinutes >= closeMinutes) {
      throw new ValidationError({
        startTime: `This resource is only bookable between ${resource.openTime} and ${resource.closeTime}`,
      });
    }

    if (endMinutes > closeMinutes) {
      throw new ValidationError({
        endTime: `Booking must end by ${resource.closeTime}`,
      });
    }

    const upcomingCount = await prisma.reservation.count({
      where: {
        userId,
        organizationId,
        status: { in: ['PENDING_ALLOCATION', 'ALLOCATED'] },
        startTime: { gte: new Date() },
      },
    });

    if (upcomingCount >= MAX_UPCOMING_BOOKINGS) {
      throw new ForbiddenError(`You can only have ${MAX_UPCOMING_BOOKINGS} upcoming bookings at a time`);
    }

    const userOverlap = await prisma.reservation.findFirst({
      where: {
        userId,
        organizationId,
        status: { in: ['PENDING_ALLOCATION', 'ALLOCATED'] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (userOverlap) {
      throw new ConflictError('You already have a booking that overlaps with this time slot', 'USER_OVERLAP');
    }

    const todayBookings = await prisma.reservation.count({
      where: {
        userId,
        organizationId,
        resource: { type: resource.type },
        status: { notIn: ['CANCELLED'] },
        startTime: { gte: startOfDay(start), lte: endOfDay(start) },
      },
    });

    if (todayBookings >= MAX_PER_RESOURCE_TYPE_PER_DAY) {
      throw new ForbiddenError(
        `You can only book ${resource.type} resources ${MAX_PER_RESOURCE_TYPE_PER_DAY} times per day`
      );
    }

    const monthBookings = await prisma.reservation.count({
      where: {
        userId,
        organizationId,
        resource: { type: resource.type },
        status: { notIn: ['CANCELLED'] },
        startTime: { gte: startOfMonth(start), lte: endOfMonth(start) },
      },
    });

    if (monthBookings >= MAX_PER_RESOURCE_TYPE_PER_MONTH) {
      throw new ForbiddenError(
        `You can only book ${resource.type} resources ${MAX_PER_RESOURCE_TYPE_PER_MONTH} times per month`
      );
    }

    const bufferedEnd = new Date(end.getTime() + BUFFER_MINUTES * 60 * 1000);

    const overlapCount = await prisma.reservation.count({
      where: {
        resourceId,
        organizationId,
        status: { in: ['PENDING_ALLOCATION', 'ALLOCATED'] },
        startTime: { lt: bufferedEnd },
        endTime: { gt: start },
      },
    });

    if (overlapCount >= resource.quantity) {
      throw new ConflictError('This time slot is fully booked', 'SLOT_TAKEN');
    }

    return prisma.reservation.create({
      data: {
        organizationId,
        resourceId,
        userId,
        startTime: start,
        endTime: end,
        notes,
        status: 'PENDING_ALLOCATION',
      },
      include: {
        resource: { select: { name: true, type: true } },
        user: { select: { name: true, email: true } },
      },
    });
  },

  async listReservations(organizationId, { resourceId, userId, status, page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    const where = { organizationId };
    if (resourceId) where.resourceId = resourceId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          resource: { select: { name: true, type: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async listMine(organizationId, userId, { status, page = 1, limit = 50 }) {
    return this.listReservations(organizationId, { userId, status, page, limit });
  },

  async listForResource(organizationId, resourceId, { from, to }) {
    const where = {
      organizationId,
      resourceId,
      status: { in: ['PENDING_ALLOCATION', 'ALLOCATED'] },
    };

    if (from && to) {
      where.startTime = { lt: new Date(to) };
      where.endTime = { gt: new Date(from) };
    } else if (from) {
      where.endTime = { gt: new Date(from) };
    } else if (to) {
      where.startTime = { lt: new Date(to) };
    }

    return prisma.reservation.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: { user: { select: { name: true } } },
    });
  },

  async allocateReservation(organizationId, reservationId) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, organizationId },
    });

    if (!reservation) throw new NotFoundError('Reservation not found');
    if (reservation.status !== 'PENDING_ALLOCATION') {
      throw new ConflictError(`Cannot allocate a reservation with status ${reservation.status}`);
    }

    return prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'ALLOCATED' },
      include: {
        resource: { select: { name: true, type: true } },
        user: { select: { name: true, email: true } },
      },
    });
  },

  async returnReservation(organizationId, reservationId, adminNotes) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, organizationId },
      include: { resource: true, user: true },
    });

    if (!reservation) throw new NotFoundError('Reservation not found');
    if (reservation.status !== 'ALLOCATED') {
      throw new ConflictError('Can only mark allocated reservations as returned');
    }

    const actualEndTime = new Date();
    const gracePeriodEnd = new Date(reservation.endTime.getTime() + BUFFER_MINUTES * 60 * 1000);
    const isLate = actualEndTime > gracePeriodEnd;

    return {
      reservation: await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'RETURNED', actualEndTime, adminNotes },
        include: {
          resource: { select: { name: true, type: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      isLate,
      gracePeriodEnd,
    };
  },

  async markNoShow(organizationId, reservationId) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, organizationId },
    });

    if (!reservation) throw new NotFoundError('Reservation not found');
    if (!['PENDING_ALLOCATION', 'ALLOCATED'].includes(reservation.status)) {
      throw new ConflictError(`Cannot mark a ${reservation.status} reservation as no-show`);
    }

    return prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'NO_SHOW' },
      include: {
        resource: { select: { name: true, type: true } },
        user: { select: { name: true, email: true } },
      },
    });
  },

  async cancelReservation(organizationId, userId, userRole, reservationId) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, organizationId },
    });

    if (!reservation) throw new NotFoundError('Reservation not found');
    if (reservation.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to cancel this reservation');
    }
    if (!['PENDING_ALLOCATION'].includes(reservation.status)) {
      throw new ConflictError('Only pending reservations can be cancelled');
    }

    return prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
      include: { resource: { select: { name: true } } },
    });
  },
};
