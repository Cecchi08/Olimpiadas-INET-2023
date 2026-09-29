import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/ui.module.css';
export default function ProtectedRoute({ requiredRole, children }) {
  const { token, usuario, rol, loading, error, checkAuth, logout } = useAuth();
  if (loading) return <p className={styles.empty} role="status">Validando sesión…</p>;
  if (!token) return <Navigate to="/login" replace />;
  if (!usuario) return <div className={styles.card}><p className={styles.error} role="alert">{error || 'No se pudo validar la sesión.'}</p><div className={styles.actions}><button className={styles.primary} onClick={checkAuth}>Reintentar</button><button className={styles.secondary} onClick={logout}>Volver al login</button></div></div>;
  if (requiredRole && rol !== requiredRole) return <Navigate to="/dashboard" replace />;
  return children || <Outlet />;
}

