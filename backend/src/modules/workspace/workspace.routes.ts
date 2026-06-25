import { Router } from 'express';
import * as workspaceController from './workspace.controller';
import { authenticate, requireRole } from '../auth/rbac.middleware';

const router = Router();

// Public route for pre-validation during registration
router.get('/by-code/:code', workspaceController.getWorkspaceByCode);

// Authenticated workspace management routes
router.get('/current', authenticate, workspaceController.getCurrentWorkspace);
router.get('/members', authenticate, workspaceController.getWorkspaceMembers);
router.post('/regenerate-code', authenticate, requireRole(['OWNER', 'RESTAURANT_OWNER']), workspaceController.regenerateWorkspaceCode);
router.post('/invite', authenticate, workspaceController.generateInviteLink);
router.put('/members/:memberId/role', authenticate, requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER']), workspaceController.updateMemberRole);
router.put('/members/:memberId/deactivate', authenticate, requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER']), workspaceController.deactivateMember);

export default router;
