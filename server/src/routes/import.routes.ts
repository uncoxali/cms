import { Router } from 'express';
import * as imp from '../controllers/import.controller';
import { requireAuth } from '../utils/auth';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/', requireAuth, upload.single('file'), imp.importData);

export default router;
