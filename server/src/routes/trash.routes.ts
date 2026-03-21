import { Router } from 'express';
import * as trash from '../controllers/trash.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, trash.getTrash);
router.post('/empty', requireAuth, trash.emptyTrash);
router.post('/:id/restore', requireAuth, trash.restoreItem);
router.delete('/:id', requireAuth, trash.permanentDelete);

export default router;
