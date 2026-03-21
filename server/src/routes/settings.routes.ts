import { Router } from 'express';
import * as settings from '../controllers/settings.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, settings.getSettings);
router.patch('/', requireAuth, settings.updateSettings);
router.get('/seo', requireAuth, settings.getSeoSettings);
router.patch('/seo', requireAuth, settings.updateSeoSettings);

export default router;
