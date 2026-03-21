import { Router } from 'express';
import * as relations from '../controllers/relations.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, relations.getRelations);
router.post('/', requireAuth, relations.createRelation);
router.delete('/:id', requireAuth, relations.deleteRelation);

export default router;
