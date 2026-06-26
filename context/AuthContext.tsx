"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '@/lib/services/authService';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/config';

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  workspace_id?: string | null;
  workspace_code?: string | null;
  restaurantId?: string;
};

const normalizeRole = (role?: string): string | undefined => {
  if (!role) return undefined;
  const upper = role.toUpperCase();
  if (upper === 'KITCHEN_STAFF' || upper === 'CHEF' || upper === 'KITCHEN') return 'CHEF';
  if (upper === 'RESTAURANT_OWNER' || upper === 'OWNER') return 'OWNER';
  return upper;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  sseActive: boolean;
  login: (email: string, password: string, workspaceCode?: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sseActive, setSseActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const restoreSession = async () => {
      const t = localStorage.getItem('auth_token');
      if (t) {
        try {
          const data = await authService.fetchMe(t);
          const normalizedUser = { ...data.user, role: normalizeRole(data.user.role) || data.user.role };
          localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
          setToken(t);
          setUser(normalizedUser);
        } catch (e) {
          console.error("Session restore failed, clearing auth details:", e);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string, workspaceCode?: string) => {
    const { token: t, user: u } = await authService.login({ email, password, workspaceCode });
    const normalizedUser = { ...u, role: normalizeRole(u.role) || u.role };
    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
    setToken(t);
    setUser(normalizedUser);
    router.push('/dashboard');
  };

  const register = async (payload: any) => {
    const { token: t, user: u } = await authService.register(payload);
    const normalizedUser = { ...u, role: normalizeRole(u.role) || u.role };
    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
    setToken(t);
    setUser(normalizedUser);
    router.push('/dashboard');
  };

  useEffect(() => {
    if (!token || !user?.workspace_id) {
      setSseActive(false);
      return;
    }
    
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let reconnectDelay = 1000;
    let active = true;

    const connect = () => {
      if (!active) return;
      const sseUrl = `${API_BASE}/workspace/updates?token=${token}`;
      console.log('Connecting to SSE Updates at:', sseUrl);
      
      try {
        eventSource = new EventSource(sseUrl);
        
        eventSource.onopen = () => {
          console.log('SSE connection opened successfully');
          setSseActive(true);
          reconnectDelay = 1000;
        };

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            console.log('SSE update received:', payload.type, payload.data);
            console.log(`[SSE RECEIVED]\n${payload.type}\n${user?.workspace_id || 'unknown'}`);
            
            setSseActive(true);
            window.dispatchEvent(new CustomEvent(payload.type, { detail: payload.data }));
            
            if (
              payload.type === 'ordersUpdated' ||
              payload.type === 'order_created' ||
              payload.type === 'order_updated' ||
              payload.type === 'order_completed' ||
              payload.type === 'order_cancelled'
            ) {
              window.dispatchEvent(new CustomEvent('ordersUpdated'));
            } else if (payload.type === 'tablesUpdated') {
              window.dispatchEvent(new CustomEvent('tablesUpdated'));
            } else if (payload.type === 'reservationsUpdated') {
              window.dispatchEvent(new CustomEvent('reservationsUpdated'));
            } else if (payload.type === 'employeesUpdated') {
              window.dispatchEvent(new CustomEvent('employeesUpdated'));
            } else if (payload.type === 'inventoryUpdated') {
              window.dispatchEvent(new CustomEvent('inventoryUpdated'));
            }
          } catch (e) {
            // ignore heartbeats
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE EventSource error, scheduling reconnect:', err);
          setSseActive(false);
          if (eventSource) {
            eventSource.close();
          }
          if (active) {
            reconnectTimeout = setTimeout(() => {
              reconnectDelay = Math.min(reconnectDelay * 2, 30000);
              connect();
            }, reconnectDelay);
          }
        };
      } catch (err) {
        console.error('Failed to create EventSource:', err);
        setSseActive(false);
        if (active) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    };

    connect();
    
    return () => {
      active = false;
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [token, user?.workspace_id]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, sseActive, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
