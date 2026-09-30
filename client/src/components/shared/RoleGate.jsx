import { useAuth } from '@/context/AuthContext';

export function RoleGate({ children, allowedRoles = [] }) {
  const { user } = useAuth();

  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
