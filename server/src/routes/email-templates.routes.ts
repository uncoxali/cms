import { Router } from 'express';
import * as emailTemplates from '../controllers/email-templates.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, emailTemplates.getEmailTemplates);
router.get('/:id', requireAuth, emailTemplates.getEmailTemplate);
router.post('/', requireAuth, emailTemplates.createEmailTemplate);
router.patch('/:id', requireAuth, emailTemplates.updateEmailTemplate);
router.delete('/:id', requireAuth, emailTemplates.deleteEmailTemplate);

export default router;
