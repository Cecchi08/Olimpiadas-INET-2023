import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Areas from './pages/Areas';
import Usuarios from './pages/Usuarios';
import ui from './styles/ui.module.css';
import './App.css';
import { useAuth } from './hooks/useAuth';
const Reportes = lazy(() => import('./pages/Reportes'));
function SessionLayout() {
  const { token } = useAuth();
  return <SocketProvider key={token}><Layout /></SocketProvider>;
}
export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute><SessionLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/pacientes" element={<Pacientes />} />
      <Route path="/areas" element={<ProtectedRoute requiredRole="Administrador"><Areas /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute requiredRole="Administrador"><Usuarios /></ProtectedRoute>} />
      <Route path="/reportes" element={<Suspense fallback={<p className={ui.empty}>Cargando reportes…</p>}><Reportes /></Suspense>} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
