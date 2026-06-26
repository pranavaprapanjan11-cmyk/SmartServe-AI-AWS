"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

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

const RoleGate: React.FC<RoleGateProps> = ({
  children,
  requiredRoles = [],
  permissions = [],
  fallback = null,
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-red-500/20 bg-red-500/5 text-red-200">
        <p className="font-semibold">Authentication required</p>
        <p className="text-xs text-slate-400">Please log in to view this content.</p>
      </div>
    );
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role || '')) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-yellow-500/20 bg-yellow-500/5 text-yellow-200">
        <p className="font-semibold">Access Denied</p>
        <p className="text-xs text-slate-400">Required role: {requiredRoles.map(r => getRoleLabel(r)).join(' or ')}</p>
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
      return fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-yellow-500/20 bg-yellow-500/5 text-yellow-200">
          <p className="font-semibold">Access Denied</p>
          <p className="text-xs text-slate-400">Required permissions: {permissions.join(', ')}</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export const useHasRole = (roles: string[]): boolean => {
  const { user } = useAuth();
  return user && user.role ? roles.includes(user.role) : false;
};

export const useHasPermission = (permissions: string[]): boolean => {
  const { user } = useAuth();
  if (!user) return false;

  const userPermissions = ROLE_PERMISSIONS[user.role || ''] || [];
  return permissions.every((perm) => userPermissions.includes(perm));
};

export const useUserRole = (): string | null => {
  const { user } = useAuth();
  return user?.role || null;
};

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

export const hasPermission = (role: string, permission: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const RestrictedPage: React.FC<{
  children: React.ReactNode;
  requiredRoles: string[];
  title?: string;
}> = ({ children, requiredRoles, title }) => {
  return (
    <RoleGate
      requiredRoles={requiredRoles}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-slate-950/40 rounded-3xl border border-white/5 backdrop-blur-xl">
          <svg className="h-16 w-16 text-yellow-500/80 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-2xl font-semibold text-white">Access Denied</h2>
          <p className="mt-2 text-slate-400 max-w-md">
            {title ? `${title} is ` : 'This page is '}
            only available to users with the following roles: {requiredRoles.map(r => getRoleLabel(r)).join(', ')}.
          </p>
        </div>
      }
    >
      {children}
    </RoleGate>
  );
};

export default RoleGate;
