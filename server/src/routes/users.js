import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import prisma from '../lib/prisma.js';
import { hashPassword } from '../lib/auth.js';
import { ConflictError } from '../lib/errors.js';

const router = Router();

// All user routes require authentication and ADMIN role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // We strictly ignore organizationId or role if passed by the client
});

const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.post('/', validate(createUserSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'MEMBER', // Forced to MEMBER
        organizationId: req.user.organizationId, // Forced to caller's org
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      next(new ConflictError('Email already in use'));
    } else {
      next(err);
    }
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { page, limit } = listUsersSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId: req.user.organizationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: { organizationId: req.user.organizationId },
      }),
    ]);

    const safeUsers = users.map(({ passwordHash: _, ...user }) => user);

    res.json({
      data: safeUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
