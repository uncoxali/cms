import { Router } from 'express';
import * as pages from '../controllers/pages.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, pages.getPages);
router.get('/:id', requireAuth, pages.getPage);
router.post('/', requireAuth, pages.createPage);
router.patch('/:id', requireAuth, pages.updatePage);
router.delete('/:id', requireAuth, pages.deletePage);

export default router;
