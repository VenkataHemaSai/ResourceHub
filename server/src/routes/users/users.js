import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { createUser, getUser, listUsers, createUserSchema } from '../../controllers/users/userController.js';

const router = Router();

router.use(requireAuth);

router.get('/:id', getUser);

router.use(requireRole('ADMIN'));

router.post('/', validate(createUserSchema), createUser);
router.get('/', listUsers);

export default router;
