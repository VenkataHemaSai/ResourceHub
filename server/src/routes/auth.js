import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { hashPassword, generateToken, setAuthCookie } from '../lib/auth.js';
import prisma from '../lib/prisma.js';
import { ConflictError } from '../lib/errors.js';

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

export default router;
