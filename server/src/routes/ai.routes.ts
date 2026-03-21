import { Router } from 'express';

import { requireAuth } from '../utils/auth';
import { chatCompletion } from '../controllers/ai.controller';

const router = Router();

router.post('/chat', requireAuth, chatCompletion);

export default router;
