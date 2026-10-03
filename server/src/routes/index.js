import { Router } from 'express';
import healthRouter from './health/health.js';
import authRouter from './auth/auth.js';
import usersRouter from './users/users.js';
import resourcesRouter from './resources/resources.js';
import reservationsRouter from './reservations/reservations.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { getDashboardStats } from '../controllers/dashboard/dashboardController.js';

const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/resources', resourcesRouter);
router.use('/reservations', reservationsRouter);

router.get('/dashboard/stats', requireAuth, requireRole('ADMIN'), getDashboardStats);

export default router;
