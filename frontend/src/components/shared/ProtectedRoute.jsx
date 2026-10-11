import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Route guard component.
 * Verifies that the user has an active session and matching role.
 * Redirects unauthenticated users to /login and mismatched roles to their portal.
 */
export const ProtectedRoute = ({ allowedRole, children }) => {
  const { token, role } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'MP' ? '/mp' : '/da'} replace />;
  }

  return children;
};

export default ProtectedRoute;
