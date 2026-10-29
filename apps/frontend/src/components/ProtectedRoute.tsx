import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Not logged in: redirect to login, remembering where they were headed
    // so they can be returned there after authenticating.
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but wrong role: Redirect to home
    return <Navigate to="/" replace />;
  }

  // Authorized: Render the nested child routes
  return <Outlet />;
};

export default ProtectedRoute;
