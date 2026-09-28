import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/health', async (req, res) => {
  let dbStatus = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'up';
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  res.json({ status: 'ok', db: dbStatus });
});

export default router;
