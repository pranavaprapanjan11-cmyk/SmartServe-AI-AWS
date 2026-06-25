// File: backend/src/modules/menu/menu.routes.ts
// Express router for menu module endpoints

import { Router } from 'express';
import {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  createMenuCategory,
  getCategories,
  getMenuStats,
  searchMenuItems,
} from './menu.controller';
import {
  validateCreateMenuItem,
  validateUpdateMenuItem,
  validateCreateMenuCategory,
  validateToggleAvailability,
} from './menu.validation';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';
import { getRestaurantId } from '../orders/orders.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Resolve restaurant ID for waiter/staff users so they see the owner's menu items
router.use(async (req, res, next) => {
  try {
    const user = (req as any).user;
    if (user) {
      const restaurantId = await getRestaurantId(user.id, user.role);
      // Temporarily override user.id to point to the resolved restaurant owner id
      (req as any).user.id = restaurantId;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ==================== MENU ITEMS ====================

// GET /api/menu - Get all menu items
router.get('/', getMenuItems);

// GET /api/menu/search - Search menu items
router.get('/search', searchMenuItems);

// ==================== CATEGORIES ====================

// GET /api/menu/categories - Get all categories
router.get('/categories', getCategories);

// POST /api/menu/categories - Create category
router.post(
  '/categories',
  authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN),
  validateCreateMenuCategory,
  createMenuCategory
);

// ==================== STATISTICS ====================

// GET /api/menu/stats - Get menu statistics
router.get(
  '/stats',
  authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN),
  getMenuStats
);

// POST /api/menu - Create menu item
router.post(
  '/',
  authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN),
  validateCreateMenuItem,
  createMenuItem
);

// GET /api/menu/:id - Get menu item by ID
router.get('/:id', getMenuItemById);

// PUT /api/menu/:id - Update menu item
router.put(
  '/:id',
  authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN),
  validateUpdateMenuItem,
  updateMenuItem
);

// DELETE /api/menu/:id - Delete menu item
router.delete(
  '/:id',
  authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN),
  deleteMenuItem
);

// PATCH /api/menu/:id/availability - Toggle availability
router.patch(
  '/:id/availability',
  authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN),
  validateToggleAvailability,
  toggleMenuItemAvailability
);

export default router;
