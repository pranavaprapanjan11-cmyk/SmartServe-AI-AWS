// File: backend/src/modules/tables/tables.routes.ts
import { Router } from 'express';
import { authenticate, requireRole } from '../auth/rbac.middleware';
import * as controller from './tables.controller';

const router = Router();

// Apply auth middleware globally to all table routes
router.use(authenticate);

// View floor / tables (Owner, Manager, Waiter, Cashier)
router.get('/', requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER', 'CASHIER']), controller.getTables);

// Create table (Owner, Manager only)
router.post('/', requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER']), controller.createTable);

// Update table / change status / assign waiter / move positions (Owner, Manager, Waiter)
router.put('/:id', requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER']), controller.updateTable);

// Delete table (Owner, Manager only)
router.delete('/:id', requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER']), controller.deleteTable);

// Reservation workflows (Owner, Manager, Waiter)
router.post('/:id/reserve', requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER']), controller.reserveTable);
router.put('/:id/reserve', requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER']), controller.editReservation);
router.delete('/:id/reserve', requireRole(['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER']), controller.cancelReservation);

export default router;
