import { Router } from 'express';
import * as templates from '../controllers/templates.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, templates.getTemplates);
router.post('/', requireAuth, templates.createTemplate);
router.patch('/:id', requireAuth, templates.updateTemplate);
router.delete('/:id', requireAuth, templates.deleteTemplate);

export default router;
