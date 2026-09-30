import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/shared/LoadingState';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullScreen message="Loading session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Authenticated but wrong role -> send to their default home
    return <Navigate to="/" replace />;
  }

  return children;
}
