// File: backend/src/modules/auth/auth.types.ts
// Types and role enums for the authentication module

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  CHEF = 'CHEF',
  KITCHEN = 'KITCHEN',
  EMPLOYEE = 'EMPLOYEE',
}

export function normalizeRole(role: string | undefined): Role | undefined {
  if (!role) return undefined;
  const upper = role.toUpperCase();
  if (upper === 'RESTAURANT_OWNER' || upper === 'OWNER') return Role.OWNER;
  if (upper === 'MANAGER') return Role.MANAGER;
  if (upper === 'KITCHEN' || upper === 'CHEF' || upper === 'KITCHEN_STAFF') return Role.KITCHEN;
  if (upper === 'WAITER') return Role.WAITER;
  if (upper === 'CASHIER') return Role.CASHIER;
  if (upper === 'EMPLOYEE') return Role.EMPLOYEE;
  if (upper === 'SUPER_ADMIN') return Role.SUPER_ADMIN;
  return undefined;
}

export function storageRole(role: string | undefined): Role | undefined {
  const normalized = normalizeRole(role);
  if (normalized === Role.KITCHEN) return Role.KITCHEN;
  if (normalized === Role.OWNER) return Role.OWNER;
  return normalized;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspace_id?: string | null;
  created_at: string;
}

export interface NewUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  workspace_id?: string | null;
}

import { Request } from 'express';

// Use explicit generics so `body` and `params` exist and are typed safely as `unknown`.
// Avoid using `any` to preserve strict typing.
export interface RequestWithUser extends Request<Record<string, unknown>, unknown, Record<string, unknown>> {
  user?: {
    id: string;
    role: Role;
    email?: string;
    restaurantId?: string;
    workspaceId?: string;
  };
}
