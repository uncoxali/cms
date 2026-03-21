import { Router } from 'express';
import * as activity from '../controllers/activity.controller';
import { requireAuth, requireAdmin } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, activity.getActivity);
router.post('/', requireAuth, activity.createActivity);
router.delete('/clear', requireAdmin, activity.clearActivity);
router.delete('/:id', requireAdmin, activity.deleteActivity);

export default router;
