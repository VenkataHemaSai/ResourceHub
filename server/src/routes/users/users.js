import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { banSchema, updateBanSchema, listBans, banUser, unbanUser, updateBan } from '../../controllers/users/banController.js';
import { createUser, getUser, listUsers, createUserSchema } from '../../controllers/users/userController.js';

const router = Router();

router.use(requireAuth);

router.get('/:id', getUser);

router.use(requireRole('ADMIN'));

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);

router.get('/bans/list', listBans);
router.post('/bans', validate(banSchema), banUser);
router.delete('/bans/:userId/:resourceType', unbanUser);
router.patch('/bans/:userId/:resourceType', validate(updateBanSchema), updateBan);

export default router;
