import prisma from '../utils/prisma.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export const resourceService = {
  /**
   * List resources for an organization with pagination and optional filtering
   */
  async listResources(organizationId, { page = 1, limit = 20, type, isActive, userRole }) {
    const skip = (page - 1) * limit;

    const where = { organizationId };

    if (type) {
      where.type = type;
    }

    // Members can ONLY see active resources. Admins can see both unless filtered.
    if (userRole === 'MEMBER') {
      where.isActive = true;
    } else if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.resource.count({ where }),
    ]);

    return {
      data: resources,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a specific resource, strictly scoped to the organization
   */
  async getResource(organizationId, resourceId) {
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        organizationId,
      },
    });

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    return resource;
  },

  /**
   * Create a new resource for the organization
   */
  async createResource(organizationId, data) {
    // Unique constraint check: [organizationId, name]
    const existing = await prisma.resource.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError('A resource with this name already exists in your organization');
    }

    return prisma.resource.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  /**
   * Update a resource's basic info
   */
  async updateResource(organizationId, resourceId, data) {
    // Verify existence and ownership
    await this.getResource(organizationId, resourceId);

    if (data.name) {
      const existing = await prisma.resource.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name: data.name,
          },
        },
      });

      if (existing && existing.id !== resourceId) {
        throw new ConflictError('A resource with this name already exists in your organization');
      }
    }

    return prisma.resource.update({
      where: { id: resourceId },
      data,
    });
  },

  /**
   * Deactivate or reactivate a resource
   */
  async setResourceStatus(organizationId, resourceId, isActive) {
    // Verify existence and ownership
    await this.getResource(organizationId, resourceId);

    return prisma.resource.update({
      where: { id: resourceId },
      data: { isActive },
    });
  },

  /**
   * Calculate availability for a specific day
   */
  async calculateAvailability(organizationId, resourceId, dateString, timezone = 'UTC') {
    const resource = await this.getResource(organizationId, resourceId);

    const startOfDay = new Date(dateString + 'T00:00:00.000Z');
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const existingReservations = await prisma.reservation.findMany({
      where: {
        resourceId,
        organizationId,
        status: 'CONFIRMED',
        startTime: { lt: endOfDay },
        endTime: { gt: startOfDay },
      },
      orderBy: { startTime: 'asc' },
    });

    return {
      resourceId,
      date: dateString,
      timezone,
      rules: {
        minDurationMinutes: resource.minDurationMinutes,
        maxDurationMinutes: resource.maxDurationMinutes,
        openTime: resource.openTime,
        closeTime: resource.closeTime,
      },
      reservations: existingReservations.map(r => ({
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    };
  }
};
