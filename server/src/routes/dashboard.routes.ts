import { Router } from 'express';
import * as dashboard from '../controllers/dashboard.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, dashboard.getDashboard);

export default router;
