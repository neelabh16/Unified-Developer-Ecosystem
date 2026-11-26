import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Skeleton from '../components/common/Skeleton';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="wrap py-16" data-testid="protected-route-loading">
        <div className="glass mx-auto max-w-xl p-8">
          <div className="mb-4 text-xs font-mono uppercase tracking-widest text-[var(--accent)]">
            Verifying session...
          </div>
          <Skeleton variant="line" count={3} className="mb-3" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  return children || <Outlet />;
}
