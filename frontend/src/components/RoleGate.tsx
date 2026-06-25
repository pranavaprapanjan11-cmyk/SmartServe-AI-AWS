import React from 'react';
import { useAuth } from '../context/AuthContext';

interface RoleGateProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
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
  CASHIER: [
    'view.billing',
    'view.payments',
    'manage.billing',
    'view.invoices',
  ],
};

/**
 * RoleGate Component
 * Restricts access to content based on user role and permissions
 * 
 * Usage:
 * <RoleGate requiredRoles={['RESTAURANT_OWNER', 'MANAGER']}>
 *   <Dashboard />
 * </RoleGate>
 * 
 * or with permissions:
 * <RoleGate permissions={['manage.inventory']}>
 *   <InventoryManagement />
 * </RoleGate>
 */
const RoleGate: React.FC<RoleGateProps> = ({
  children,
  requiredRoles = [],
  permissions = [],
  fallback = null,
}) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="role-gate-unauthorized">
        <p>Authentication required. Please log in.</p>
      </div>
    );
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role || '')) {
    return (
      <div className="role-gate-forbidden">
        <p>You don't have permission to access this page.</p>
        <small>Required role: {requiredRoles.join(' or ')}</small>
      </div>
    );
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const userPermissions = ROLE_PERMISSIONS[user.role || ''] || [];
    const hasRequiredPermission = permissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasRequiredPermission) {
      return (
        <div className="role-gate-forbidden">
          <p>You don't have the required permissions.</p>
          <small>Required permissions: {permissions.join(', ')}</small>
        </div>
      );
    }
  }

  return <>{children}</>;
};

/**
 * useHasRole Hook
 * Check if user has a specific role
 */
export const useHasRole = (roles: string[]): boolean => {
  const { user } = useAuth();
  return user && user.role ? roles.includes(user.role) : false;
};

/**
 * useHasPermission Hook
 * Check if user has specific permissions
 */
export const useHasPermission = (permissions: string[]): boolean => {
  const { user } = useAuth();
  if (!user) return false;

  const userPermissions = ROLE_PERMISSIONS[user.role || ''] || [];
  return permissions.every((perm) => userPermissions.includes(perm));
};

/**
 * useUserRole Hook
 * Get current user role
 */
export const useUserRole = (): string | null => {
  const { user } = useAuth();
  return user?.role || null;
};

/**
 * getRoleLabel function
 * Get human-readable role label
 */
export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    RESTAURANT_OWNER: 'Owner',
    MANAGER: 'Manager',
    WAITER: 'Waiter',
    CHEF: 'Chef',
    KITCHEN_STAFF: 'Kitchen Staff',
    CASHIER: 'Cashier',
  };
  return labels[role] || role;
};

/**
 * hasPermission utility function
 * Check if a role has specific permissions
 */
export const hasPermission = (role: string, permission: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Restricted Page Component
 * Use for entire pages that need role protection
 */
export const RestrictedPage: React.FC<{
  children: React.ReactNode;
  requiredRoles: string[];
  title?: string;
}> = ({ children, requiredRoles, title }) => {
  return (
    <RoleGate
      requiredRoles={requiredRoles}
      fallback={
        <div className="restricted-page-fallback">
          <div className="restricted-content">
            <h2>Access Denied</h2>
            <p>
              {title ? `${title} is ` : ''}
              only available for: {requiredRoles.join(', ')}
            </p>
          </div>
        </div>
      }
    >
      {children}
    </RoleGate>
  );
};

export default RoleGate;
