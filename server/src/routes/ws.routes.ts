import { Router } from 'express';
import * as wsController from '../controllers/ws.controller';
import { requireAdmin } from '../utils/auth';

const router = Router();

router.get('/', requireAdmin, wsController.getEndpoints);
router.post('/', requireAdmin, wsController.createEndpoint);
router.patch('/:id', requireAdmin, wsController.updateEndpoint);
router.delete('/:id', requireAdmin, wsController.deleteEndpoint);

export default router;
