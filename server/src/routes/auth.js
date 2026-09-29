import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { hashPassword, comparePassword, generateToken, setAuthCookie, clearAuthCookie } from '../lib/auth.js';
import prisma from '../lib/prisma.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';

const router = Router();

const registerSchema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  userName: z.string().min(2, 'User name must be at least 2 characters'),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { orgName, userName, email, password } = req.body;

    // Fast check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    let slug = slugify(orgName);
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
    }

    const passwordHash = await hashPassword(password);

    // Transaction guarantees either both are created, or neither is created
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
        }
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          name: userName,
          email,
          passwordHash,
          role: 'ADMIN',
        }
      });

      return user;
    });

    // Generate token & set HTTP-only cookie
    const token = generateToken({
      userId: result.id,
      organizationId: result.organizationId,
      role: result.role,
    });
    setAuthCookie(res, token);

    // Strip passwordHash before sending the response
    const { passwordHash: _, ...safeUser } = result;

    res.status(201).json(safeUser);
  } catch (err) {
    // Let global error handler catch it (including Prisma unique constraint errors if concurrent)
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      next(new ConflictError('Email already in use'));
    } else {
      next(err);
    }
  }
});

const loginSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });
    
    setAuthCookie(res, token);

    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

export default router;
