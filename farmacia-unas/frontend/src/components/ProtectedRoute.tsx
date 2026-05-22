import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import type { RolUsuario } from '@/types';

interface Props {
  roles?: RolUsuario[];
}

export function ProtectedRoute({ roles }: Props) {
  const { accessToken, user } = useAuth();
  const location = useLocation();

  if (!accessToken) {
    if (location.pathname !== '/') {
      localStorage.setItem('returnTo', location.pathname + location.search);
    }
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
