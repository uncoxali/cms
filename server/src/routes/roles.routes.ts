import { Router } from 'express';
import * as roles from '../controllers/roles.controller';
import { requireAuth } from '../utils/auth';

const router = Router();

router.get('/', requireAuth, roles.getRoles);
router.get('/:id', requireAuth, roles.getRole);
router.post('/', requireAuth, roles.createRole);
router.patch('/:id', requireAuth, roles.updateRole);
router.delete('/:id', requireAuth, roles.deleteRole);
router.get('/:id/permissions', requireAuth, roles.getRolePermissions);
router.patch('/:id/permissions', requireAuth, roles.updateRolePermissions);

export default router;
