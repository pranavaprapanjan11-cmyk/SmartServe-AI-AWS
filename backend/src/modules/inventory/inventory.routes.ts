import { Router } from 'express';
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItem,
  fetchInventoryItems,
  fetchLowStockItems,
  fetchRecipeForMenuItem,
  saveRecipeForMenuItem,
  updateInventoryItem,
  
  // New handlers
  remakeItem,
  fetchSuppliers,
  fetchSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  fetchPurchaseOrders,
  fetchPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  fetchWastageList,
  createWastage,
  fetchWastageAnalytics,
  fetchInventoryForecast,
  fetchReconciliations,
  fetchLatestReconciliation,
  submitReconciliation,
  fetchTransactions,
  fetchAuditForm
} from './inventory.controller';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import {
  validateCreateInventoryItem,
  validateUpdateInventoryItem,
  validateSaveRecipeForMenuItem,
} from './inventory.validation';
import { Role } from '../auth/auth.types';

const router = Router();
router.use(authenticateJWT);

// Low Stock & Recipes
router.get('/low-stock', fetchLowStockItems);
router.get('/recipes/menu-item/:menuItemId', fetchRecipeForMenuItem);
router.post(
  '/recipes/menu-item/:menuItemId',
  authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN),
  validateSaveRecipeForMenuItem,
  saveRecipeForMenuItem
);

// Dish Remake
router.post('/orders/:orderId/items/:itemId/remake', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), remakeItem);

// Suppliers
router.get('/suppliers', fetchSuppliers);
router.get('/suppliers/:id', fetchSupplier);
router.post('/suppliers', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), createSupplier);
router.put('/suppliers/:id', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), updateSupplier);
router.delete('/suppliers/:id', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), deleteSupplier);

// Purchase Orders
router.get('/purchase-orders', fetchPurchaseOrders);
router.get('/purchase-orders/:id', fetchPurchaseOrder);
router.post('/purchase-orders', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), createPurchaseOrder);
router.put('/purchase-orders/:id/status', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), updatePurchaseOrderStatus);
router.delete('/purchase-orders/:id', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), deletePurchaseOrder);

// Wastage
router.get('/wastage', fetchWastageList);
router.get('/wastage/analytics', fetchWastageAnalytics);
router.post('/wastage', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), createWastage);

// Forecast
router.get('/forecast', fetchInventoryForecast);

// Transactions Ledger
router.get('/transactions', fetchTransactions);

// Reconciliation
router.get('/reconciliations', fetchReconciliations);
router.get('/reconciliations/latest', fetchLatestReconciliation);
router.get('/reconciliations/audit-form', fetchAuditForm);
router.post('/reconciliations', authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), submitReconciliation);

// Core Items CRUD
router.get('/', fetchInventoryItems);
router.get('/:id', fetchInventoryItem);
router.post(
  '/',
  authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN),
  validateCreateInventoryItem,
  createInventoryItem
);
router.put(
  '/:id',
  authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN),
  validateUpdateInventoryItem,
  updateInventoryItem
);
router.delete(
  '/:id',
  authorizeRoles(Role.MANAGER, Role.OWNER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN),
  deleteInventoryItem
);

export default router;
