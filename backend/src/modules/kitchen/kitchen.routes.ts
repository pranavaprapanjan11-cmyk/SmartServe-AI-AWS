import { Router } from 'express';
import { getKitchenOrders, startCooking, ready, served } from './kitchen.controller';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';

const router = Router();

// Apply auth middleware to all kitchen endpoints
router.use(authenticateJWT);

// Apply role checks (Allow: OWNER, MANAGER, CHEF. Block: WAITER, CASHIER)
router.use(
  authorizeRoles(
    Role.OWNER,
    Role.MANAGER,
    Role.CHEF,
    Role.SUPER_ADMIN
  )
);

// GET /api/kitchen/orders - Retrieve orders grouped by status
router.get('/orders', getKitchenOrders);

// PUT /api/kitchen/orders/:id/start-cooking - Move NEW -> PREPARING
router.put('/orders/:id/start-cooking', startCooking);

// PUT /api/kitchen/orders/:id/ready - Move PREPARING -> READY
router.put('/orders/:id/ready', ready);

// PUT /api/kitchen/orders/:id/served - Move READY -> SERVED (Triggers inventory deductions)
router.put('/orders/:id/served', served);

export default router;
