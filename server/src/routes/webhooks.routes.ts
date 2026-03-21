import { Router } from 'express';
import * as webhooks from '../controllers/webhooks.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, webhooks.getWebhooks);
router.get('/:id', requireAuth, webhooks.getWebhook);
router.post('/', requireAuth, webhooks.createWebhook);
router.patch('/:id', requireAuth, webhooks.updateWebhook);
router.delete('/:id', requireAuth, webhooks.deleteWebhook);
router.post('/:id/test', requireAuth, webhooks.testWebhook);
router.get('/:id/logs', requireAuth, webhooks.getWebhookLogs);

export default router;
