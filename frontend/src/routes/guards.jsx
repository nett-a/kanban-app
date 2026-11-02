import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageSpinner } from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Only same-app paths are allowed as post-login redirect targets (no open redirect). */
const safeRedirect = (path) => (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/');

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to={safeRedirect(location.state?.from)} replace />;
  return <Outlet />;
}
