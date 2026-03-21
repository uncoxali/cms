import { Router } from 'express';
import * as comments from '../controllers/comments.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, comments.getComments);
router.post('/', requireAuth, comments.createComment);
router.patch('/:id', requireAuth, comments.updateComment);
router.delete('/:id', requireAuth, comments.deleteComment);

export default router;
