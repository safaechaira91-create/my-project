﻿﻿import { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from './Skeleton';

const ProtectedRoute = ({
  allowedRoles = [],
  redirectPath = '/login',
  unauthorizedPath = '/',
  children
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Normalize allowed roles with a stable dependency check.
  // JSON.stringify keeps this correct even if the parent passes a new
  // array reference with the same contents on every render.
  const normalizedRoles = useMemo(
    () => allowedRoles.map((role) => String(role).toLowerCase()),
    [JSON.stringify(allowedRoles)]
  );

  // Normalize user roles securely
  const userRoles = useMemo(() => {
    if (Array.isArray(user?.roles)) {
      return user.roles.map((r) => String(r).toLowerCase());
    }
    if (typeof user?.role === 'string') {
      return [user.role.toLowerCase()];
    }
    return ['user'];
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-md" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={redirectPath}
        state={{ from: location }}
        replace
      />
    );
  }

  const hasAccess =
    normalizedRoles.length === 0 ||
    userRoles.some((role) => normalizedRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;