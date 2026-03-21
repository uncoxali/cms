import { Router } from 'express';
import * as analytics from '../controllers/analytics.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, analytics.getAnalytics);

export default router;
