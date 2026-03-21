import { Router } from 'express';
import * as users from '../controllers/users.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, users.getUsers);
router.get('/:id', requireAuth, users.getUser);
router.post('/', requireAuth, users.createUser);
router.patch('/:id', requireAuth, users.updateUser);
router.delete('/:id', requireAuth, users.deleteUser);

export default router;
