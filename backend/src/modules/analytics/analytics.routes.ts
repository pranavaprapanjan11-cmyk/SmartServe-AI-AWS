import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';
import { getDashboard } from './analytics.controller';

const router = Router();
router.use(authenticateJWT);

router.get('/dashboard', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), getDashboard);

export default router;
