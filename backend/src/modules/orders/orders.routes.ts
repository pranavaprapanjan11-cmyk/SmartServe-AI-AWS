// File: backend/src/modules/orders/orders.routes.ts
// Express router for orders module endpoints

import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByTable,
  updateOrderStatus,
  deleteOrder,
  updateOrderItems,
} from './orders.controller';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
} from './orders.validation';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';

const router = Router();

// Apply authentication and role-based access to all orders routes
router.use(authenticateJWT);
router.use(
  authorizeRoles(
    Role.OWNER,
    Role.MANAGER,
    Role.CASHIER,
    Role.WAITER,
    Role.CHEF,
    Role.SUPER_ADMIN
  )
);

// GET /api/orders - Get all orders for the restaurant
router.get('/', getOrders);

// POST /api/orders - Create a new order
router.post(
  '/',
  authorizeRoles(Role.WAITER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN),
  validateCreateOrder,
  createOrder
);

// GET /api/orders/table/:tableNumber - Get orders for a specific table
router.get('/table/:tableNumber', getOrdersByTable);

// GET /api/orders/:id - Get detailed information for an order
router.get('/:id', getOrderById);

// PUT /api/orders/:id/status - Update order status
router.put(
  '/:id/status',
  authorizeRoles(Role.CHEF, Role.WAITER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN),
  validateUpdateOrderStatus,
  updateOrderStatus
);

// PUT /api/orders/:id/items - Update order items (Reopen bill)
router.put(
  '/:id/items',
  authorizeRoles(Role.CASHIER, Role.WAITER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN),
  updateOrderItems
);

// DELETE /api/orders/:id - Delete an order
router.delete(
  '/:id',
  authorizeRoles(Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN),
  deleteOrder
);

export default router;
