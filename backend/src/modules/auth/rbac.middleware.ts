import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { normalizeRole } from './auth.types';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
    workspaceId?: string;
  };
}

export interface RBACConfig {
  requiredRoles?: string[];
  requiresAuth?: boolean;
}

/**
 * RBAC Roles
 * RESTAURANT_OWNER - Full system access
 * MANAGER - Analytics, inventory, employees, reports
 * WAITER - Orders, tables, customer interactions
 * KITCHEN_STAFF - Kitchen orders, inventory updates
 * CASHIER - Billing, payments, invoices
 */
export const RBAC_ROLES = {
  OWNER: 'OWNER',
  RESTAURANT_OWNER: 'RESTAURANT_OWNER',
  MANAGER: 'MANAGER',
  WAITER: 'WAITER',
  CHEF: 'CHEF',
  KITCHEN_STAFF: 'KITCHEN_STAFF',
  KITCHEN: 'KITCHEN',
  CASHIER: 'CASHIER',
  EMPLOYEE: 'EMPLOYEE',
};

export const ROLE_PERMISSIONS = {
  OWNER: [
    'view.dashboard',
    'view.analytics',
    'view.inventory',
    'view.employees',
    'view.billing',
    'view.orders',
    'view.settings',
    'manage.all',
    'view.ocr',
    'manage.ocr',
  ],
  RESTAURANT_OWNER: [
    'view.dashboard',
    'view.analytics',
    'view.inventory',
    'view.employees',
    'view.billing',
    'view.orders',
    'view.settings',
    'manage.all',
    'view.ocr',
    'manage.ocr',
  ],
  MANAGER: [
    'view.dashboard',
    'view.analytics',
    'view.inventory',
    'view.employees',
    'view.orders',
    'manage.inventory',
    'manage.employees',
  ],
  WAITER: [
    'view.orders',
    'view.tables',
    'manage.orders',
    'view.menu',
  ],
  CHEF: [
    'view.kitchen',
    'view.orders',
    'update.orders',
    'view.inventory',
  ],
  KITCHEN_STAFF: [
    'view.kitchen',
    'view.orders',
    'update.orders',
    'view.inventory',
  ],
  KITCHEN: [
    'view.kitchen',
    'view.orders',
    'update.orders',
    'view.inventory',
  ],
  CASHIER: [
    'view.billing',
    'view.payments',
    'manage.billing',
    'view.invoices',
  ],
  EMPLOYEE: [
    'view.orders',
    'view.tables',
    'view.menu',
  ],
};

/**
 * Authenticate JWT token
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const normalizedRole = normalizeRole(decoded.role) || decoded.role;
    const userId = decoded.sub || decoded.id;

    // Resolve restaurant ID using the orders.service helper
    const { getRestaurantId } = require('../orders/orders.service');
    const rId = await getRestaurantId(userId, normalizedRole);

    // Resolve workspaceId
    let workspaceId = decoded.workspaceId;
    if (!workspaceId) {
      const { Pool } = require('pg');
      const tempPool = new Pool({ connectionString: process.env.DATABASE_URL });
      const { rows } = await tempPool.query('SELECT workspace_id FROM users WHERE id = $1 LIMIT 1', [userId]);
      await tempPool.end();
      if (rows.length > 0) {
        workspaceId = rows[0].workspace_id;
      }
    }

    req.user = {
      id: userId,
      email: decoded.email,
      role: normalizedRole,
      restaurantId: rId,
      workspaceId: workspaceId,
    } as any;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

/**
 * Check if user has permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const permissions = ROLE_PERMISSIONS[req.user.role as keyof typeof ROLE_PERMISSIONS] || [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Permission denied',
        required: permission,
        role: req.user.role,
      });
    }

    next();
  };
};

/**
 * Check multiple conditions
 */
export const checkAccess = (config: RBACConfig) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check authentication
    if (config.requiresAuth && !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check roles
    if (config.requiredRoles && req.user) {
      if (!config.requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: config.requiredRoles,
          current: req.user.role,
        });
      }
    }

    next();
  };
};

/**
 * Verify restaurant ownership
 */
export const verifyRestaurantOwnership = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const restaurantIdFromRequest = req.params.restaurantId || req.body.restaurantId;
  
  if (
    req.user.role !== RBAC_ROLES.OWNER &&
    req.user.role !== RBAC_ROLES.RESTAURANT_OWNER &&
    req.user.restaurantId !== restaurantIdFromRequest
  ) {
    return res.status(403).json({
      error: 'Cannot access other restaurants',
    });
  }

  next();
};

/**
 * Optional auth middleware
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const normalizedRole = normalizeRole(decoded.role) || decoded.role;
      req.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        role: normalizedRole,
        restaurantId: decoded.restaurantId || decoded.sub || decoded.id,
      };
    }
  } catch (error) {
    // Silently ignore invalid tokens in optional auth
  }
  next();
};
