import { Router } from 'express';
import * as translations from '../controllers/translations.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, translations.getTranslations);
router.post('/', requireAuth, translations.createOrUpdateTranslation);
router.delete('/', requireAuth, translations.deleteTranslation);

export default router;
