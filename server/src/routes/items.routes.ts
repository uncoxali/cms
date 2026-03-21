import { Router } from 'express';
import * as items from '../controllers/items.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/:collection', requireAuth, items.getItems);
router.get('/:collection/:id', requireAuth, items.getItem);
router.post('/:collection', requireAuth, items.createItem);
router.patch('/:collection/:id', requireAuth, items.updateItem);
router.delete('/:collection/:id', requireAuth, items.deleteItem);

export default router;
