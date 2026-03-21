import { Router } from 'express';
import * as flows from '../controllers/flows.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, flows.getFlows);
router.get('/:id', requireAuth, flows.getFlow);
router.post('/', requireAuth, flows.createFlow);
router.patch('/:id', requireAuth, flows.updateFlow);
router.delete('/:id', requireAuth, flows.deleteFlow);

export default router;
