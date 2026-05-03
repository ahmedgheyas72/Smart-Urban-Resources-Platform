import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export function ServiceProviderRoute({ children }) {
  const { user, isServiceProvider, loading } = useAuth();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isServiceProvider) return <Navigate to="/" replace />;
  return children;
}
