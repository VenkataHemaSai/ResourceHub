import prisma from '../utils/prisma.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js';

export const reservationService = {
  /**
   * Create a new reservation
   */
  async createReservation(organizationId, userId, data) {
    const { resourceId, startTime, endTime, notes } = data;

    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, organizationId },
    });

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (!resource.isActive) {
      throw new ForbiddenError('Cannot book an inactive resource');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new ConflictError('End time must be after start time');
    }

    const overlap = await prisma.reservation.findFirst({
      where: {
        resourceId,
        status: 'CONFIRMED',
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlap) {
      throw new ConflictError('SLOT_TAKEN: This resource is already booked for the requested time');
    }

    try {
      const reservation = await prisma.reservation.create({
        data: {
          organizationId,
          resourceId,
          userId,
          startTime: start,
          endTime: end,
          notes,
          status: 'CONFIRMED',
        },
        include: {
          resource: { select: { name: true, type: true } },
          user: { select: { name: true, email: true } },
        },
      });

      return reservation;
    } catch (error) {
      if (
        (error.code === 'P2004' || error.code === 'P2010') &&
        (error.message.includes('exclude_overlapping_reservations') || error.message.includes('conflicting key value'))
      ) {
        throw new ConflictError('SLOT_TAKEN: This resource is already booked for the requested time');
      }
      throw error;
    }
  },


  /**
   * List reservations with filtering
   */
  async listReservations(organizationId, { resourceId, userId, upcomingOnly, page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    
    const where = { organizationId };

    if (resourceId) where.resourceId = resourceId;
    if (userId) where.userId = userId;
    
    if (upcomingOnly === 'true') {
      where.endTime = { gte: new Date() };
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: {
          resource: {
            select: { name: true, type: true }
          },
          user: {
            select: { name: true }
          }
        }
      }),
      prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Cancel a reservation
   */
  async cancelReservation(organizationId, userId, userRole, reservationId) {
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        organizationId,
      },
    });

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    // Only the creator or an ADMIN can cancel it
    if (reservation.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to cancel this reservation');
    }

    if (reservation.status === 'CANCELLED') {
      return reservation; // already cancelled
    }

    return prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
      include: {
        resource: {
          select: { name: true }
        }
      }
    });
  },
};
