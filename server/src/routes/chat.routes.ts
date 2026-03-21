import { Router } from 'express';
import * as chat from '../controllers/chat.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/rooms', requireAuth, chat.getRooms);
router.post('/rooms', requireAuth, chat.createRoom);
router.get('/messages', requireAuth, chat.getMessages);
router.post('/messages', requireAuth, chat.sendMessage);

export default router;
