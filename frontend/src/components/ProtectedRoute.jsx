import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/ui.module.css';
export default function ProtectedRoute({ requiredRole, children }) {
  const { token, rol, loading } = useAuth();
  if (loading) return <p className={styles.empty} role="status"><span className={styles.spinner} />Validando sesión…</p>;
  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && rol !== requiredRole) return <Navigate to="/dashboard" replace />;
  return children || <Outlet />;
}
