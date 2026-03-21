import { Router } from 'express';
import * as revisions from '../controllers/revisions.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, revisions.getRevisions);

export default router;
