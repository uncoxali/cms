import { Router } from 'express';
import * as exp from '../controllers/export.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.post('/', requireAuth, exp.exportData);

export default router;
