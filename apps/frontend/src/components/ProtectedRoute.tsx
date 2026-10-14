import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Not logged in: Redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but wrong role: Redirect to home
    return <Navigate to="/" replace />;
  }

  // Authorized: Render the nested child routes
  return <Outlet />;
};

export default ProtectedRoute;