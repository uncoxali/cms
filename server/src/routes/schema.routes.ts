import { Router } from 'express';
import * as schema from '../controllers/schema.controller';
import { requireAuth, requireAdmin } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, schema.getSchema);
router.get('/:collection', requireAuth, schema.getCollectionSchema);
router.post('/:collection', requireAdmin, schema.createCollection);
router.patch('/:collection', requireAdmin, schema.updateCollectionSchema);
router.delete('/:collection', requireAdmin, schema.deleteCollection);

export default router;
