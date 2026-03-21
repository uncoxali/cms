import { Router } from 'express';
import * as init from '../controllers/init.controller';

const router = Router();

router.get('/', init.checkInit);
router.post('/', init.initializeDb);

export default router;
