"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  roles?: string[]; // allowed roles
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!token || !user) {
        router.replace('/auth/login');
      } else if (roles && roles.length > 0 && !roles.includes(user.role || '')) {
        router.replace('/auth/login'); // Or a forbidden page if desired
      }
    }
  }, [user, token, loading, roles, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A13] text-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading your operating session...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return null; // router.replace will handle redirection in useEffect
  }

  if (roles && roles.length > 0 && !roles.includes(user.role || '')) {
    return null; // router.replace will handle redirection in useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute;
