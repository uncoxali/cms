import { Router } from 'express';
import * as files from '../controllers/files.controller';
import { requireAuth } from '../utils/auth';
import multer from 'multer';
import path from 'path';
import { config } from '../config';

const upload = multer({
    dest: path.join(config.uploadDir, 'tmp'),
    limits: { fileSize: config.maxFileSize },
});

const router = Router();

router.get('/', requireAuth, files.getFiles);
router.get('/:id/view', files.viewFile);
router.get('/:id', requireAuth, files.getFile);
router.post('/', requireAuth, upload.single('file'), files.uploadFile);
router.post('/migrate-to-db', requireAuth, files.migrateToDb);
router.patch('/:id', requireAuth, files.updateFile);
router.delete('/:id', requireAuth, files.deleteFile);

export default router;
