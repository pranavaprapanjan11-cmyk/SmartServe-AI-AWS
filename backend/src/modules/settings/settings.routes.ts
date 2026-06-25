// File: backend/src/modules/settings/settings.routes.ts

import { Router } from 'express';
import {
  createPrinterSetting,
  fetchPrinterSettings,
  fetchRestaurantSettings,
  savePrinterSettings,
  saveRestaurantSettings,
} from './settings.controller';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';

const router = Router();
router.use(authenticateJWT);

router.get('/restaurant', authorizeRoles(Role.OWNER, Role.SUPER_ADMIN), fetchRestaurantSettings);
router.put('/restaurant', authorizeRoles(Role.OWNER, Role.SUPER_ADMIN), saveRestaurantSettings);

router.get('/printers', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchPrinterSettings);
router.post('/printers', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), createPrinterSetting);
router.put('/printers/:id', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), saveRestaurantSettings);

export default router;
