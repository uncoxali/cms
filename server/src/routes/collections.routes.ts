import { Router } from 'express';
import * as collections from '../controllers/collections.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, collections.getCollections);
router.get('/:name', requireAuth, collections.getCollection);
router.post('/', requireAuth, collections.createCollection);
router.patch('/:name', requireAuth, collections.updateCollection);
router.delete('/:name', requireAuth, collections.deleteCollection);

export default router;
