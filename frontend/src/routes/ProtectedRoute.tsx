// File: frontend/src/routes/ProtectedRoute.tsx
// Route wrapper for React Router v6 to protect routes and enforce role-based access

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactElement;
  roles?: string[]; // allowed roles
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(user.role || '')) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
