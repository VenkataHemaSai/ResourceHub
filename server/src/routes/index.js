import { Router } from 'express';
import healthRouter from './health/health.js';
import authRouter from './auth/auth.js';
import usersRouter from './users/users.js';
import resourcesRouter from './resources/resources.js';
import reservationsRouter from './reservations/reservations.js';

const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/resources', resourcesRouter);
router.use('/reservations', reservationsRouter);

export default router;
