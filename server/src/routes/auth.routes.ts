import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.post('/refresh', requireAuth, auth.refreshToken);
router.get('/me', requireAuth, auth.getMe);

export default router;
