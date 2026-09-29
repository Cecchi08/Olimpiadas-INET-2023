## package.json

~~~~json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "playwright test",
    "export:code": "node scripts/export-code.mjs"
  },
  "dependencies": {
    "axios": "^1.20.0",
    "framer-motion": "^13.4.6",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^6.30.1",
    "recharts": "^3.10.1",
    "socket.io-client": "^4.8.4"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@playwright/test": "^1.63.0",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "eslint": "^10.10.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.6",
    "globals": "^17.12.0",
    "socket.io": "^4.8.4",
    "vite": "^8.3.0"
  }
}
~~~~

## .env.example

~~~~text
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
~~~~

## index.html

~~~~html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1e293b" />
    <meta name="description" content="Código Azul — Gestión de emergencias hospitalarias" />
    <title>Código Azul | Central hospitalaria</title>
  </head>
  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>
~~~~

## src/main.jsx

~~~~jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';
import './styles/global.module.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider><App /></AuthProvider>
  </BrowserRouter></StrictMode>
);
~~~~

## src/index.css

~~~~css
/* El reset global se importa como CSS Module desde main.jsx. */
~~~~

## src/App.jsx

~~~~jsx
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
~~~~

## src/App.css

~~~~css
/* Los estilos visuales están definidos en CSS Modules. */
~~~~

## src/services/api.js

~~~~javascript
import axios from 'axios';

export const TOKEN_KEY = 'codigoAzul.token';
export const AUTH_EXPIRED = 'codigoAzul:auth-expired';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', timeout: 20000 });
api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  const requestToken = error.config?.headers?.Authorization;
  if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/login') &&
      requestToken === `Bearer ${localStorage.getItem(TOKEN_KEY)}`) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_EXPIRED));
  }
  return Promise.reject(error);
});

export async function listarTodos(path, params = {}, signal) {
  const rows = [];
  for (let page = 1; ; page++) {
    const { data } = await api.get(path, { params: { ...params, page, limit: 500 }, signal });
    if (Array.isArray(data)) return data;
    if (!Array.isArray(data.data)) throw new Error('La API devolvió un listado inválido.');
    rows.push(...data.data);
    if (rows.length >= data.total || !data.data.length || (data.total == null && data.data.length < 500)) return rows;
    if (page >= 2000) throw new Error('El listado es demasiado grande. Acotá los filtros.');
  }
}
export function mensajeError(error) {
  const data = error.response?.data;
  if (data instanceof Blob) return 'No se pudo descargar el reporte. Revisá los filtros e intentá nuevamente.';
  const detail = data?.details || data?.errors;
  const fields = Array.isArray(detail) ? detail.map(item => item.msg || item.message).filter(Boolean).join(' · ') : '';
  return [typeof data?.error === 'string' ? data.error : data?.message, fields].filter(Boolean).join(': ') ||
    (error.code === 'ERR_NETWORK' ? 'No se pudo conectar con el servidor.' : error.message || 'No se pudo completar la operación.');
}
export default api;
~~~~

## src/services/socket.js

~~~~javascript
import { io } from 'socket.io-client';
export function crearSocket(token) {
  return io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', { auth: { token }, autoConnect: true });
}
~~~~

## src/context/AuthContext.jsx

~~~~jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { AUTH_EXPIRED, TOKEN_KEY, mensajeError } from '../services/api';
import { AuthContext } from './contexts';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(0);
  const logout = useCallback(() => {
    version.current++;
    localStorage.removeItem(TOKEN_KEY);
    setToken(null); setUsuario(null); setLoading(false); setError('');
    navigate('/login', { replace: true });
  }, [navigate]);
  const checkAuth = useCallback(async () => {
    const current = ++version.current;
    const stored = localStorage.getItem(TOKEN_KEY);
    setLoading(true); setError('');
    if (!stored) { setToken(null); setUsuario(null); setLoading(false); return; }
    try {
      const { data } = await api.get('/api/auth/me');
      if (current !== version.current) return;
      setUsuario(data.usuario || data); setToken(stored);
    } catch (err) {
      if (current === version.current) setError(mensajeError(err));
    } finally {
      if (current === version.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const lifecycle = version;
    const timer = setTimeout(checkAuth, 0);
    const sync = event => { if (event.key === TOKEN_KEY) checkAuth(); };
    window.addEventListener(AUTH_EXPIRED, logout);
    window.addEventListener('storage', sync);
    return () => { clearTimeout(timer); lifecycle.current++; window.removeEventListener(AUTH_EXPIRED, logout); window.removeEventListener('storage', sync); };
  }, [checkAuth, logout]);
  async function login(email, password) {
    const current = ++version.current;
    const { data } = await api.post('/api/auth/login', { email, password });
    if (!data.token || !data.usuario) throw new Error('Respuesta de autenticación incompleta.');
    if (current !== version.current) return;
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token); setUsuario({ ...data.usuario, rol: data.usuario.rol || data.rol }); setError('');
  }
  return <AuthContext.Provider value={{ usuario, token, rol: usuario?.rol, loading, error, login, logout, checkAuth }}>{children}</AuthContext.Provider>;
}
~~~~

## src/context/SocketContext.jsx

~~~~jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { crearSocket } from '../services/socket';
import { listarTodos, mensajeError } from '../services/api';
import { SocketContext } from './contexts';

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [ultimoLlamado, setUltimoLlamado] = useState(null);
  const [alertaAzul, setAlertaAzul] = useState(null);
  const [activos, setActivos] = useState([]);
  const [sincronizado, setSincronizado] = useState(false);
  useEffect(() => {
    if (!token) return;
    const socket = crearSocket(token);
    let alive = true;
    let sequence = 0;
    let generation = 0;
    let changes = [];
    let syncing = false;
    let controller;
    const log = (tipo, mensaje) => setLogs(previous => [...previous.slice(-499), { id: `${Date.now()}-${sequence++}`, timestamp: new Date(), tipo, mensaje }]);
    const merge = (rows, event) => event.kind === 'remove' ? rows.filter(row => String(row.id) !== String(event.data.id)) :
      [...rows.filter(row => String(row.id) !== String(event.data.id)), event.data];
    async function sync() {
      const current = ++generation;
      changes = []; syncing = true; controller?.abort(); controller = new AbortController();
      setConectado(true); setSincronizado(false);
      socket.emit('join', 'hospital');
      log('info', 'Conexión establecida. Sincronizando llamados activos…');
      try {
        const rows = await listarTodos('/api/llamados/activos', {}, controller.signal);
        if (!alive || current !== generation) return;
        setActivos(changes.reduce(merge, rows)); setSincronizado(true); syncing = false; changes = [];
        log('info', 'Llamados activos sincronizados.');
      } catch (error) {
        if (alive && current === generation && error.code !== 'ERR_CANCELED') { syncing = false; changes = []; log('danger', mensajeError(error)); }
      }
    }
    socket.on('connect', sync);
    socket.on('disconnect', () => { generation++; controller?.abort(); setConectado(false); setSincronizado(false); log('warning', 'Conexión interrumpida. Los datos pueden estar desactualizados.'); });
    socket.on('connect_error', error => { setConectado(false); log('danger', `No se pudo conectar: ${error.message}`); });
    socket.on('nuevoLlamado', data => {
      const change = { kind: 'add', data }; if (syncing) changes.push(change);
      setActivos(previous => merge(previous, change)); setUltimoLlamado(data);
      log('warning', `🔵 Paciente ${data.paciente?.nombre || data.nombre || '#' + data.paciente_id} activó Código Azul en ${data.area?.nombre || data.area_nombre || '#' + data.area_id} (${data.origen})`);
    });
    socket.on('llamadoAtendido', data => {
      const change = { kind: 'remove', data }; if (syncing) changes.push(change);
      setActivos(previous => merge(previous, change));
      log('info', `✅ Enfermero ${data.enfermero?.nombre || data.enfermero?.email || data.nombre || 'asignado'} atendió. Tiempo: ${data.tiempo_respuesta_segundos ?? data.tiempo_respuesta_seg ?? '—'}s`);
    });
    socket.on('codigoAzul', data => {
      setAlertaAzul({ ...data, eventId: ++sequence });
      log('danger', `🚨 ALERTA: Código Azul en ${data.area?.nombre || data.area_nombre || '#' + data.area_id}`);
    });
    socket.on('logSistema', data => log('info', typeof data === 'string' ? data : data.mensaje || 'Evento del sistema'));
    return () => { alive = false; controller?.abort(); socket.removeAllListeners(); socket.disconnect(); };
  }, [token]);
  return <SocketContext.Provider value={{ logs, conectado, ultimoLlamado, alertaAzul, activos, sincronizado }}>{children}</SocketContext.Provider>;
}
~~~~

## src/hooks/useAuth.js

~~~~javascript
import { useContext } from 'react';
import { AuthContext } from '../context/contexts';
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requiere AuthProvider');
  return context;
}
~~~~

## src/hooks/useSocket.js

~~~~javascript
import { useContext } from 'react';
import { SocketContext } from '../context/contexts';
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket requiere SocketProvider');
  return context;
}
~~~~

## src/utils/formateoFechas.js

~~~~javascript
export function formatearHora(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--:--:--' : date.toLocaleTimeString('es-AR', { hour12: false });
}
export function formatearFecha(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-AR');
}
export function filtrosReporte({ area_id, origen, desde, hasta }) {
  return {
    ...(area_id && { area_id }), ...(origen && { origen }),
    ...(desde && { fecha_desde: new Date(`${desde}T00:00:00`).toISOString() }),
    ...(hasta && { fecha_hasta: new Date(`${hasta}T23:59:59.999`).toISOString() }),
  };
}
~~~~

## src/utils/constantes.js

~~~~javascript
export const TIPOS_AREA = ['Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'Secretaria', 'SalaEspera', 'Enfermeria', 'Pasillo'];
export const NOMBRES_TIPO = { Quirofano: 'Quirófano', Habitacion: 'Habitación', Bano: 'Baño', Recepcion: 'Recepción', Secretaria: 'Secretaría', SalaEspera: 'Sala de espera', Enfermeria: 'Enfermería', Pasillo: 'Pasillo' };
export const ROLES = ['Administrador', 'Generico'];
// Referencia de dimensiones únicamente; nunca se presentan áreas ficticias como datos del servidor.
export const PLANO_REFERENCIA = [
  ['Recepción', 'Recepcion', 12, 17, 18, 22], ['Secretaría', 'Secretaria', 32, 17, 16, 20],
  ['Sala de Espera', 'SalaEspera', 56, 17, 22, 22], ['Enfermería', 'Enfermeria', 82, 17, 20, 20],
  ['Pasillo', 'Pasillo', 50, 37, 90, 8], ['Quirófano', 'Quirofano', 15, 62, 22, 28],
  ['Baño 1', 'Bano', 8, 84, 9, 10], ['Baño 2', 'Bano', 22, 84, 9, 10],
  ['Habitación 1', 'Habitacion', 55, 56, 20, 18], ['Habitación 2', 'Habitacion', 80, 56, 20, 18],
  ['Habitación 3', 'Habitacion', 55, 80, 20, 18], ['Habitación 4', 'Habitacion', 80, 80, 20, 18],
].map(([nombre, tipo, coordenadas_x, coordenadas_y, ancho, alto]) => ({ nombre, tipo, coordenadas_x, coordenadas_y, ancho, alto }));
export function normalizarArea(area) {
  const reference = PLANO_REFERENCIA.find(item => item.nombre === area.nombre) || PLANO_REFERENCIA.find(item => item.tipo === area.tipo);
  return { ...area, coordenadas_x: area.coordenadas_x ?? area.coord_x, coordenadas_y: area.coordenadas_y ?? area.coord_y, ancho: area.ancho ?? reference?.ancho ?? 16, alto: area.alto ?? reference?.alto ?? 18 };
}
export function posicion(item) {
  return { left: `${item.coordenadas_x ?? item.coord_x}%`, top: `${item.coordenadas_y ?? item.coord_y}%` };
}
~~~~

## src/components/ProtectedRoute.jsx

~~~~jsx
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
~~~~

## src/components/Layout.jsx

~~~~jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSocket } from '../hooks/useSocket';
import styles from './Layout.module.css';
export default function Layout() {
  const { conectado } = useSocket();
  return <div className={styles.layout}><Sidebar /><div className={styles.workspace}>
    <header className={styles.topbar}><span>Central hospitalaria <span className={styles.separator}>/</span> <strong>Gestión de emergencias</strong></span><span className={conectado ? styles.online : styles.offline}><i />{conectado ? 'Sistema conectado' : 'Sin conexión en vivo'}</span></header>
    <main id="contenido" className={styles.main}><Outlet /></main>
    <footer className={styles.footer}><span>Código Azul · Atención conectada</span><span>Central de monitoreo hospitalario</span></footer>
  </div></div>;
}
~~~~

## src/components/Layout.module.css

~~~~css
.layout { min-height: 100vh; display: grid; grid-template-columns: 232px minmax(0, 1fr); }
.workspace { display: flex; flex-direction: column; min-width: 0; }
.topbar { height: 72px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: white; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
.topbar strong { font-weight: 500; color: #475569; }
.separator { padding: 0 13px; color: #cbd5e1; }
.online, .offline { display: flex; align-items: center; gap: 7px; white-space: nowrap; font-size: 11px; color: #047857; }
.online i, .offline i { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
.offline { color: #b45309; }.offline i { background: #f59e0b; }
.main { padding: 32px; flex: 1; min-width: 0; }
.footer { padding: 16px 32px; display: flex; justify-content: space-between; color: #94a3b8; font-size: 11px; gap: 14px; }
@media(max-width: 1100px) { .layout { grid-template-columns: 200px minmax(0, 1fr); }.main { padding: 24px; } }
@media(max-width: 760px) { .layout { grid-template-columns: 1fr; }.topbar { padding: 0 18px; height: 56px; }.topbar > span:first-child { display: none; }.main { padding: 22px 16px; }.footer { padding: 16px; flex-wrap: wrap; } }
~~~~

## src/components/Sidebar.jsx

~~~~jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from './Icon';
import styles from './Sidebar.module.css';
export default function Sidebar() {
  const { usuario, rol, logout } = useAuth();
  const links = [['dashboard', 'Dashboard'], ['pacientes', 'Pacientes'], ...(rol === 'Administrador' ? [['areas', 'Áreas'], ['usuarios', 'Usuarios']] : []), ['reportes', 'Reportes']];
  return <aside className={styles.sidebar}>
    <a href="#contenido" className={styles.skip}>Ir al contenido</a>
    <NavLink to="/dashboard" className={styles.brand}><span className={styles.cross}>+</span><span>Código Azul<small>GESTIÓN HOSPITALARIA</small></span></NavLink>
    <div className={styles.navLabel}>ESPACIO DE TRABAJO</div>
    <nav className={styles.nav} aria-label="Navegación principal">{links.map(([path, label]) => <NavLink key={path} to={'/' + path} className={({ isActive }) => isActive ? styles.active : styles.link}><Icon name={path} />{label}</NavLink>)}</nav>
    <div className={styles.support}><Icon name="pulse" /><p>Cada segundo cuenta.<span>Conectados para cuidar.</span></p></div>
    <div className={styles.account}><span className={styles.avatar}>{usuario.email?.slice(0, 2).toUpperCase()}</span><div><strong title={usuario.email}>{usuario.email}</strong><small>{rol === 'Administrador' ? 'Administrador' : 'Personal de salud'}</small></div></div>
    <button className={styles.logout} onClick={logout}><Icon name="logout" size={17} />Cerrar sesión</button>
  </aside>;
}
~~~~

## src/components/Sidebar.module.css

~~~~css
.sidebar { position: sticky; top: 0; height: 100dvh; min-width: 0; background: #1e293b; color: #cbd5e1; padding: 30px 18px 20px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 10px; color: white; font-size: 22px; font-weight: 650; letter-spacing: -.6px; padding: 0 8px; }
.brand small { display: block; font-size: 8px; letter-spacing: 1.6px; color: #94a3b8; margin-top: 5px; }
.cross { display: grid; place-items: center; background: #3b82f6; width: 36px; height: 36px; border-radius: 10px; font-size: 32px; font-weight: 400; }
.navLabel { margin: 47px 13px 15px; font-size: 9px; color: #8190a7; letter-spacing: 1.4px; font-weight: 600; }
.nav { display: grid; gap: 7px; }.link, .active { display: flex; align-items: center; gap: 12px; padding: 13px 14px; font-size: 13px; border-radius: 7px; }
.link:hover { background: #ffffff08; color: white; }.active { background: #3b82f6; color: white; box-shadow: 0 4px 12px #00000016; }
.support { margin-top: auto; padding: 30px 12px; color: #6f87ab; }.support p { margin: 8px 0 0; font-size: 12px; color: #aab8cc; }.support span { display: block; font-size: 10px; color: #72849e; margin-top: 6px; }
.account { display: flex; gap: 10px; padding: 20px 5px 10px; border-top: 1px solid #ffffff10; align-items: center; }.avatar { background: #334155; color: #cbd5e1; border-radius: 50%; width: 34px; height: 34px; display: grid; place-items: center; font-size: 11px; flex-shrink: 0; }.account div { min-width: 0; }.account strong { display: block; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e2e8f0; font-weight: 500; }.account small { display: block; font-size: 10px; color: #8293ae; margin-top: 5px; }
.logout { background: none; border: 0; color: #94a3b8; display: flex; align-items: center; gap: 9px; padding: 12px 9px; font-size: 11px; }.logout:hover { color: white; }
.skip { position: fixed; left: 12px; top: 0; transform: translateY(-150%); }.skip:focus { transform: translateY(0); background: white; color: #1e293b; padding: 12px; z-index: 100; }
@media(max-width: 760px) { .sidebar { position: static; height: auto; padding: 18px 16px; }.brand { font-size: 20px; }.navLabel, .support, .account { display: none; }.nav { display: flex; overflow-x: auto; margin-top: 20px; gap: 4px; }.link, .active { padding: 10px; font-size: 11px; gap: 6px; }.logout { position: absolute; top: 20px; right: 12px; }.logout svg { display: none; } }
~~~~

## src/components/Modal.jsx

~~~~jsx
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
export default function Modal({ title, onClose, children }) {
  const titleId = useId();
  const dialog = useRef(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
    (focusable().find(element => element.tagName === 'INPUT') || dialog.current).focus();
    function keydown(event) {
      if (event.key === 'Escape') close.current();
      if (event.key === 'Tab') {
        const elements = focusable(); const first = elements[0]; const last = elements.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  return createPortal(<div className={styles.backdrop} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} tabIndex={-1}><header><h2 id={titleId}>{title}</h2><button onClick={onClose} aria-label="Cerrar modal">×</button></header>{children}</section></div>, document.body);
}
~~~~

## src/components/Modal.module.css

~~~~css
.backdrop { position: fixed; inset: 0; z-index: 100; background: #0f172a88; backdrop-filter: blur(3px); display: grid; place-items: center; padding: 24px; }.dialog { width: min(540px, 100%); max-height: 90dvh; overflow-y: auto; border-radius: 14px; padding: 26px; background: white; box-shadow: 0 25px 90px #0f172a44; }.dialog header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }.dialog h2 { font-size: 20px; letter-spacing: -.5px; margin: 0; }.dialog header button { border: 0; background: #f1f5f9; width: 30px; height: 30px; border-radius: 6px; color: #64748b; font-size: 23px; }
~~~~

## src/components/Avatar.jsx

~~~~jsx
import { motion, useReducedMotion } from 'framer-motion';
import { posicion } from '../utils/constantes';
import styles from './Avatar.module.css';
export default function Avatar({ tipo = 'cama', nombre, coordenadas_x, coordenadas_y, alerta = false }) {
  const reduce = useReducedMotion();
  return <div className={styles.avatar} style={posicion({ coordenadas_x, coordenadas_y })} title={nombre} aria-label={nombre + (alerta ? ' · Llamado activo' : '')}>
    {alerta && <motion.span className={styles.pulse} animate={reduce ? {} : { scale: [1, 1.8], opacity: [.8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />}
    <span className={styles[tipo]}>{tipo === 'paciente' ? 'P' : tipo === 'enfermero' ? 'E' : '·'}</span>
    {tipo !== 'cama' && <small>{nombre}</small>}
  </div>;
}
~~~~

## src/components/Avatar.module.css

~~~~css
.avatar { position: absolute; transform: translate(-50%, -50%); z-index: 3; display: flex; align-items: center; flex-direction: column; width: 70px; pointer-events: none; }.paciente, .enfermero, .cama { display: grid; place-items: center; height: 23px; width: 23px; border-radius: 50%; border: 2px solid white; font-size: 10px; color: white; font-weight: 700; box-shadow: 0 2px 5px #0f172a22; }.paciente { background: #10b981; }.enfermero { background: #3b82f6; }.cama { width: 12px; height: 12px; background: #94a3b8; }.avatar small { font-size: clamp(6px, .65vw, 10px); margin-top: 2px; color: #334155; background: #ffffffdd; padding: 1px 3px; border-radius: 3px; text-align: center; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.pulse { position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #ef4444; top: -3px; z-index: -1; }
~~~~

## src/components/AreaMapa.jsx

~~~~jsx
import { imagenArea, planoVectorial } from '../utils/imagenesAreas';
import { posicion } from '../utils/constantes';
import styles from './AreaMapa.module.css';
export default function AreaMapa({ area }) {
  return <><img className={styles.area} src={imagenArea(area)} alt={area.nombre} draggable="false" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = planoVectorial(area.tipo); }} style={{ ...posicion(area), width: `${area.ancho}%`, height: `${area.alto}%` }} /><span className={styles.label} style={{ left: `${area.coordenadas_x}%`, top: `${area.coordenadas_y - area.alto / 2 + 1.5}%` }}>{area.nombre}</span></>;
}
~~~~

## src/components/AreaMapa.module.css

~~~~css
.area { position: absolute; transform: translate(-50%, -50%); object-fit: fill; user-select: none; }.label { position: absolute; transform: translateX(-50%); font-size: clamp(6px, .67vw, 11px); font-weight: 600; white-space: nowrap; color: #52677f; z-index: 2; pointer-events: none; background: #ffffffb0; border-radius: 3px; padding: 1px 4px; }
~~~~

## src/components/MapaHospital.jsx

~~~~jsx
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRecursos } from '../hooks/useRecursos';
import { useSocket } from '../hooks/useSocket';
import { normalizarArea } from '../utils/constantes';
import AreaMapa from './AreaMapa';
import Avatar from './Avatar';
import Icon from './Icon';
import styles from './MapaHospital.module.css';
import ui from '../styles/ui.module.css';

export default function MapaHospital() {
  const { data, loading, error, reload } = useRecursos(['/api/areas', '/api/camas', '/api/pacientes']);
  const { activos, alertaAzul } = useSocket();
  const [visibleAlert, setVisibleAlert] = useState(null);
  const reduce = useReducedMotion();
  const areas = useMemo(() => (data['/api/areas'] || []).map(normalizarArea), [data]);
  const camas = data['/api/camas'] || [];
  const pacientes = data['/api/pacientes'] || [];
  const enfermeros = useMemo(() => {
    const assigned = new Map();
    for (const patient of data['/api/pacientes'] || []) {
      const id = patient.enfermero_asignado_id ?? patient.enfermero_id;
      if (!id) continue;
      const key = `${id}-${patient.area_id}`;
      assigned.set(key, { id: key, nombre: patient.enfermero?.nombre || patient.enfermero?.email || 'Enfermero asignado', area_id: patient.area_id });
    }
    return [...assigned.values()];
  }, [data]);
  useEffect(() => {
    if (!alertaAzul) return;
    const show = setTimeout(() => setVisibleAlert(alertaAzul), 0);
    const hide = setTimeout(() => setVisibleAlert(null), 3000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [alertaAzul]);
  const geometryValid = area => [area.coordenadas_x, area.coordenadas_y, area.ancho, area.alto].every(value => value != null && Number.isFinite(Number(value)));
  return <section className={styles.panel}>
    <header className={styles.header}><div><span className={styles.icon}><Icon name="areas" size={18} /></span><h2>Mapa del hospital<small>Distribución de áreas y pacientes</small></h2></div><button className={ui.secondary} onClick={reload} disabled={loading} aria-label="Actualizar mapa">↻ Actualizar</button></header>
    {error && <p className={ui.error} role="alert">{error}</p>}
    <div className={styles.viewport}><div className={styles.map} aria-label="Plano del hospital, coordenadas sobre un canvas de 1920 por 1080">
      {loading && <p className={styles.state} role="status">Cargando plano del hospital…</p>}
      {!loading && !areas.length && <p className={styles.state}>{error ? 'Plano no disponible' : 'Todavía no hay áreas registradas.'}</p>}
      {areas.filter(geometryValid).map(area => <AreaMapa key={area.id} area={area} />)}
      {camas.map(cama => {
        const x = cama.coordenadas_x ?? cama.coord_x; const y = cama.coordenadas_y ?? cama.coord_y;
        if (x == null || y == null) return null;
        const patient = pacientes.find(item => String(item.cama_id) === String(cama.id));
        return <Avatar key={cama.id} tipo={patient ? 'paciente' : 'cama'} nombre={patient?.nombre || cama.nombre} coordenadas_x={x} coordenadas_y={y} alerta={Boolean(patient && activos.some(call => String(call.paciente_id) === String(patient.id)))} />;
      })}
      {enfermeros.map((enfermero, index) => {
        const area = areas.find(item => String(item.id) === String(enfermero.area_id));
        return area && geometryValid(area) ? <Avatar key={enfermero.id} tipo="enfermero" nombre={enfermero.nombre} coordenadas_x={Number(area.coordenadas_x) + Number(area.ancho) / 2 - 3 - (index % 2) * 3} coordenadas_y={Number(area.coordenadas_y) + Number(area.alto) / 2 - 3} /> : null;
      })}
      {visibleAlert && <motion.div key={visibleAlert.eventId} className={styles.alert} role="alert" initial={{ opacity: .3 }} animate={{ opacity: reduce ? .35 : [.3, .7, .3] }} transition={{ duration: 1, repeat: 2 }}><strong>CÓDIGO AZUL · {visibleAlert.area?.nombre || visibleAlert.area_nombre || 'Emergencia'}</strong></motion.div>}
    </div></div>
    <footer className={styles.legend}><div><span><i className={styles.patient} />Paciente</span><span><i className={styles.nurse} />Enfermero asignado</span><span><i className={styles.call} />Llamado activo</span><span><i className={styles.bed} />Cama libre</span></div><small>Vista de planta · 1920 × 1080</small></footer>
    {areas.some(area => !geometryValid(area)) && <p className={ui.notice}>Hay áreas sin coordenadas válidas que no pueden ubicarse en el plano.</p>}
  </section>;
}
~~~~

## src/components/MapaHospital.module.css

~~~~css
.panel { min-width: 0; display: flex; flex-direction: column; background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }.header { padding: 19px 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #edf1f5; }.header > div { display: flex; align-items: center; gap: 10px; }.header h2 { font-size: 14px; margin: 0; font-weight: 600; }.header small { display: block; color: #94a3b8; font-size: 10px; font-weight: 400; margin-top: 5px; }.header button { font-size: 10px; padding: 7px 9px; }.icon { width: 34px; height: 34px; border-radius: 8px; background: #eff6ff; color: #3b82f6; display: grid; place-items: center; }.viewport { padding: 12px; flex: 1; display: flex; align-items: center; }.map { position: relative; width: 100%; aspect-ratio: 16 / 9; background-color: white; background-image: linear-gradient(#e9eef680 1px, transparent 1px), linear-gradient(90deg, #e9eef680 1px, transparent 1px); background-size: 18px 18px; border-radius: 5px; overflow: hidden; }.state { position: absolute; inset: 0; display: grid; place-items: center; color: #94a3b8; font-size: 13px; text-align: center; }.legend { padding: 14px 20px; border-top: 1px solid #edf1f5; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }.legend > div { display: flex; gap: 14px; flex-wrap: wrap; }.legend span { display: flex; align-items: center; gap: 5px; font-size: 9px; color: #64748b; }.legend i { width: 6px; height: 6px; border-radius: 50%; }.legend small { color: #94a3b8; font-size: 9px; }.patient { background: #10b981; }.nurse { background: #3b82f6; }.call { background: #ef4444; }.bed { background: #94a3b8; }.alert { position: absolute; inset: 0; background: #ef4444; z-index: 8; pointer-events: none; display: grid; place-items: center; }.alert strong { color: white; font-size: clamp(14px, 2vw, 28px); }
~~~~

## src/components/Consola.jsx

~~~~jsx
import { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { formatearHora } from '../utils/formateoFechas';
import styles from './Consola.module.css';
export default function Consola() {
  const { logs, conectado } = useSocket();
  const content = useRef(null);
  useEffect(() => { if (content.current) content.current.scrollTop = content.current.scrollHeight; }, [logs]);
  return <section className={styles.console} aria-label="Consola del sistema"><header><h2>🖥️ CONSOLA DEL SISTEMA</h2><span className={conectado ? styles.live : styles.offline}>{conectado ? 'EN VIVO' : 'OFFLINE'}</span></header><div className={styles.logs} ref={content} role="log" aria-live="polite" aria-relevant="additions">{logs.length ? logs.map(log => <p key={log.id} className={styles[log.tipo]}><time>[{formatearHora(log.timestamp)}]</time> {log.mensaje}</p>) : <p className={styles.wait}>Esperando eventos...<span className={styles.cursor}>▌</span></p>}</div><footer><span>●</span> {logs.length} eventos en esta sesión</footer></section>;
}
~~~~

## src/components/Consola.module.css

~~~~css
.console { background: #0a0a0a; color: #00ff00; border-radius: 12px; overflow: hidden; height: 100%; display: flex; flex-direction: column; min-height: 300px; font-family: Consolas, Monaco, monospace; }.console header { display: flex; justify-content: space-between; gap: 6px; flex-wrap: wrap; padding: 18px 14px; border-bottom: 1px solid #ffffff12; }.console h2 { font-size: 10px; letter-spacing: .6px; font-weight: 500; margin: 0; color: #c5cedb; }.live, .offline { font-size: 8px; letter-spacing: 1px; }.offline { color: #ffcc00; }.logs { padding: 16px 14px; overflow-y: auto; flex: 1; height: 0; min-height: 190px; font-size: 11px; line-height: 1.8; overflow-wrap: anywhere; scrollbar-width: thin; scrollbar-color: #334155 #0a0a0a; }.logs p { margin-bottom: 15px; }.logs time { color: #657280; }.info { color: #00ff00; }.warning { color: #ffcc00; }.danger { color: #ff4444; }.wait { color: #6a7b70; }.cursor { color: #00ff00; }.console footer { padding: 12px 14px; border-top: 1px solid #ffffff12; font-size: 9px; color: #6b7280; }.console footer span { color: #00ff00; margin-right: 5px; }
~~~~

## src/components/TablaGenerica.jsx

~~~~jsx
import styles from './TablaGenerica.module.css';
export default function TablaGenerica({ columns, rows, loading = false, empty = 'No hay registros para mostrar.', actions }) {
  return <div className={styles.wrapper}><table className={styles.table}><thead><tr>{columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}{actions && <th scope="col">Acciones</th>}</tr></thead><tbody>{loading || !rows.length ? <tr><td className={styles.empty} colSpan={columns.length + Number(Boolean(actions))} role="status">{loading ? 'Cargando registros…' : empty}</td></tr> : rows.map(row => <tr key={row.id}>{columns.map(column => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}{actions && <td><div className={styles.actions}>{actions(row)}</div></td>}</tr>)}</tbody></table></div>;
}
~~~~

## src/components/TablaGenerica.module.css

~~~~css
.wrapper { width: 100%; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; background: white; }.table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }.table th { padding: 15px 18px; color: #64748b; font-weight: 500; font-size: 11px; white-space: nowrap; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }.table td { padding: 17px 18px; border-bottom: 1px solid #f1f5f9; max-width: 260px; overflow-wrap: anywhere; line-height: 1.5; }.table tbody tr:last-child td { border-bottom: 0; }.table tbody tr:hover { background: #f8fbff; }.empty { text-align: center; color: #94a3b8; height: 180px; }.actions { display: flex; gap: 8px; white-space: nowrap; }.actions button { font-size: 11px; padding: 7px 10px; }
~~~~

## src/components/GraficoBarras.jsx

~~~~jsx
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ui from '../styles/ui.module.css';
export default function GraficoBarras({ data }) {
  if (!data.length) return <p className={ui.empty}>No hay llamados para estos filtros.</p>;
  return <ResponsiveContainer width="100%" height={270}><BarChart data={data} margin={{ top: 15, right: 12, bottom: 20, left: -15 }} accessibilityLayer><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f5" /><XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#eff6ff' }} /><Bar dataKey="cantidad" name="Llamados" fill="#3b82f6" radius={[5, 5, 0, 0]} maxBarSize={40} /></BarChart></ResponsiveContainer>;
}
~~~~

## src/components/GraficoPastel.jsx

~~~~jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ui from '../styles/ui.module.css';
export default function GraficoPastel({ data }) {
  if (!data.some(row => row.cantidad > 0)) return <p className={ui.empty}>No hay llamados para estos filtros.</p>;
  return <ResponsiveContainer width="100%" height={270}><PieChart accessibilityLayer><Pie data={data} dataKey="cantidad" nameKey="nombre" innerRadius={60} outerRadius={88} paddingAngle={3}>{data.map(row => <Cell key={row.nombre} fill={row.nombre === 'Emergencia' ? '#ef4444' : '#3b82f6'} />)}</Pie><Tooltip /><Legend iconType="circle" iconSize={8} /></PieChart></ResponsiveContainer>;
}
~~~~

## src/components/GraficoLineas.jsx

~~~~jsx
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ui from '../styles/ui.module.css';
export default function GraficoLineas({ data }) {
  if (!data.length) return <p className={ui.empty}>No hay llamados atendidos para calcular el tiempo de respuesta.</p>;
  return <ResponsiveContainer width="100%" height={270}><LineChart data={data} margin={{ top: 15, right: 20, bottom: 15, left: 0 }} accessibilityLayer><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f5" /><XAxis dataKey="fecha" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis unit=" s" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={value => [`${value} s`, 'Tiempo promedio']} /><Line type="monotone" dataKey="promedio" name="Tiempo promedio" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} /></LineChart></ResponsiveContainer>;
}
~~~~

## src/pages/Login.jsx

~~~~jsx
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { mensajeError } from '../services/api';
import Icon from '../components/Icon';
import styles from './Login.module.css';
import ui from '../styles/ui.module.css';
export default function Login() {
  const { login, usuario, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <p className={ui.empty}>Validando sesión…</p>;
  if (usuario) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const values = new FormData(event.currentTarget);
    try { await login(values.get('email').trim(), values.get('password')); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(mensajeError(err)); }
    finally { setBusy(false); }
  }
  return <main className={styles.page}><section className={styles.story}><div className={styles.brand}><span>+</span>Código Azul</div><div className={styles.message}><div className={styles.line}><Icon name="pulse" size={90} /></div><p>ATENCIÓN CONECTADA</p><h1>Cada segundo<br />hace la diferencia.</h1><h2>Un hospital conectado.<br />Un equipo listo para responder.</h2></div><footer>GESTIÓN DE EMERGENCIAS HOSPITALARIAS</footer></section><section className={styles.access}><div className={styles.formWrap}><span className={styles.label}>CENTRAL HOSPITALARIA</span><h2>Bienvenido de nuevo</h2><p>Ingresá con tu cuenta para acceder al sistema.</p><form className={ui.form} onSubmit={submit}><label className={ui.field}>Correo electrónico<input type="email" name="email" autoComplete="username" placeholder="nombre@hospital.com" required disabled={busy} /></label><label className={ui.field}>Contraseña<input type="password" name="password" autoComplete="current-password" placeholder="Ingresá tu contraseña" required disabled={busy} /></label>{error && <div role="alert" className={ui.error}>{error}</div>}<button className={ui.primary} disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar al sistema →'}</button></form><p className={styles.help}>¿Necesitás acceso? Contactá al administrador de tu hospital.</p></div><footer>Código Azul · Gestión hospitalaria</footer></section></main>;
}
~~~~

## src/pages/Login.module.css

~~~~css
.page { min-height: 100dvh; display: grid; grid-template-columns: 1fr 1fr; }.story { padding: 48px 64px; background: #1e293b; color: white; display: flex; flex-direction: column; position: relative; overflow: hidden; }.story::after { content: ''; position: absolute; width: 480px; height: 480px; border: 1px solid #3b82f625; border-radius: 50%; bottom: -250px; right: -100px; box-shadow: 0 0 0 70px #3b82f608, 0 0 0 140px #3b82f605; pointer-events: none; }.brand { display: flex; align-items: center; gap: 12px; font-size: 25px; font-weight: 650; letter-spacing: -.7px; }.brand span { background: #3b82f6; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; font-size: 36px; font-weight: 400; }.message { margin: auto 0; padding: 70px 0; }.line { color: #60a5fa; margin-bottom: 25px; }.message > p { font-size: 10px; letter-spacing: 2px; color: #93c5fd; }.message h1 { font-size: clamp(30px, 3.6vw, 55px); letter-spacing: -2px; line-height: 1.15; margin: 24px 0; }.message h2 { font-size: 16px; font-weight: 400; line-height: 1.9; color: #94a3b8; }.story footer { font-size: 9px; letter-spacing: 1.5px; color: #64748b; }.access { display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 45px; background: #fcfdff; }.formWrap { width: min(370px, 100%); margin: auto; }.label { font-size: 9px; letter-spacing: 1.6px; font-weight: 700; color: #3b82f6; }.formWrap h2 { margin: 16px 0 10px; font-size: 28px; letter-spacing: -.9px; }.formWrap > p { font-size: 13px; color: #64748b; margin-bottom: 32px; line-height: 1.7; }.formWrap form { gap: 22px; }.formWrap form button { padding: 13px; }.formWrap .help { margin: 25px 0 0; text-align: center; font-size: 11px; color: #94a3b8; }.access footer { font-size: 10px; color: #94a3b8; padding-top: 40px; }
@media(max-width: 760px) { .page { grid-template-columns: 1fr; }.story { padding: 24px; }.message, .story footer { display: none; }.access { min-height: calc(100dvh - 90px); padding: 32px 24px; } }
~~~~

## src/pages/Dashboard.jsx

~~~~jsx
import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useRecursos } from '../hooks/useRecursos';
import api, { mensajeError } from '../services/api';
import MapaHospital from '../components/MapaHospital';
import Consola from '../components/Consola';
import Icon from '../components/Icon';
import { formatearHora } from '../utils/formateoFechas';
import styles from './Dashboard.module.css';
import ui from '../styles/ui.module.css';
export default function Dashboard() {
  const { activos, conectado, sincronizado } = useSocket();
  const { data, loading, error } = useRecursos(['/api/pacientes', '/api/camas']);
  const [pending, setPending] = useState(null);
  const [actionError, setActionError] = useState('');
  const [atendidos, setAtendidos] = useState([]);
  async function atender(id) {
    setPending(id); setActionError('');
    try { await api.put(`/api/llamados/${id}/atender`, {}); setAtendidos(previous => [...previous, id]); }
    catch (err) { setActionError(mensajeError(err)); }
    finally { setPending(null); }
  }
  const metrics = [
    ['pacientes', 'Pacientes registrados', loading || error ? '—' : data['/api/pacientes']?.length, 'En el hospital', styles.blue],
    ['pulse', 'Llamados activos', sincronizado ? activos.length : '—', sincronizado ? 'Pendientes de atención' : 'Esperando sincronización', styles.red],
    ['bed', 'Camas disponibles', loading || error ? '—' : data['/api/camas']?.filter(cama => !data['/api/pacientes']?.some(patient => String(patient.cama_id) === String(cama.id))).length, 'Disponibilidad actual', styles.green],
    ['clock', 'Monitoreo en vivo', conectado ? 'Conectado' : 'Sin conexión', conectado ? 'Recepción de eventos activa' : 'Intentando reconectar', styles.purple],
  ];
  return <>
    <div className={ui.header}><div><p className={ui.eyebrow}>CENTRAL DE MONITOREO</p><h1 className={ui.title}>Todo el hospital, conectado.</h1><p className={ui.subtitle}>Supervisá la atención y respondé a cada llamado en tiempo real.</p></div><span className={styles.date}>{new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
    {error && <p className={ui.error} role="alert">{error}</p>}
    <div className={styles.metrics}>{metrics.map(([icon, label, value, help, color]) => <article className={styles.metric} key={label}><div className={styles.metricTop}><span>{label}</span><span className={color}><Icon name={icon} size={17} /></span></div><strong>{value}</strong><small>{help}</small></article>)}</div>
    {!sincronizado && <p className={ui.notice} role="status">El estado de los llamados todavía no está sincronizado. Los datos pueden estar desactualizados.</p>}
    <div className={styles.board}><MapaHospital /><Consola /></div>
    <section className={styles.activity}><header><div><h2>Llamados que requieren atención</h2><p>Seguimiento de solicitudes activas del hospital</p></div><span className={ui.badge}>{sincronizado ? activos.length : '—'} pendientes</span></header>
      {actionError && <p className={ui.error} role="alert">{actionError}</p>}
      {!activos.length ? <div className={styles.clear}><span><Icon name="pulse" size={25} /></span><strong>{sincronizado ? 'No hay llamados pendientes' : 'Esperando datos del servidor'}</strong><p>{sincronizado ? 'Los nuevos llamados aparecerán aquí automáticamente.' : 'Verificá la conexión con el sistema hospitalario.'}</p></div> :
        <div className={styles.calls}>{activos.map(call => <article key={call.id}><span className={call.tipo === 'Emergencia' ? styles.emergency : styles.normal}>{call.tipo}</span><div><strong>{call.paciente?.nombre || `Paciente #${call.paciente_id}`}</strong><small>{call.area?.nombre || `Área #${call.area_id}`} · {call.origen} · {formatearHora(call.fecha_hora_activacion || call.fecha_activacion)}</small></div><button className={ui.primary} disabled={pending !== null || !conectado || atendidos.includes(call.id)} onClick={() => atender(call.id)}>{pending === call.id ? 'Atendiendo…' : atendidos.includes(call.id) ? 'Atendido' : 'Atender llamado'}</button></article>)}</div>}
    </section>
  </>;
}
~~~~

## src/pages/Dashboard.module.css

~~~~css
.date { color: #64748b; font-size: 11px; background: white; border: 1px solid #e2e8f0; padding: 10px 13px; border-radius: 7px; white-space: nowrap; }.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 26px; }.metric { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 19px 20px; }.metricTop { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; gap: 7px; }.metricTop > span:last-child { border-radius: 7px; padding: 7px; display: flex; }.metric strong { display: block; font-size: clamp(18px, 1.8vw, 28px); letter-spacing: -.8px; margin: 9px 0 7px; }.metric small { font-size: 10px; color: #94a3b8; }.blue { background: #eff6ff; color: #3b82f6; }.red { background: #fff1f2; color: #ef4444; }.green { background: #ecfdf5; color: #10b981; }.purple { background: #f5f3ff; color: #8b5cf6; }.board { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); gap: 18px; align-items: stretch; }.activity { margin-top: 26px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }.activity > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 24px; border-bottom: 1px solid #edf1f5; }.activity h2 { font-size: 14px; margin: 0 0 5px; }.activity header p { font-size: 11px; color: #94a3b8; margin: 0; }.clear { text-align: center; padding: 30px 18px; }.clear > span { width: 44px; height: 44px; display: grid; place-items: center; margin: 0 auto 12px; background: #ecfdf5; color: #10b981; border-radius: 50%; }.clear strong { font-size: 12px; font-weight: 500; }.clear p { font-size: 11px; color: #94a3b8; margin: 6px 0 0; }.calls article { display: flex; align-items: center; gap: 16px; padding: 18px 24px; border-bottom: 1px solid #f1f5f9; }.calls article > div { flex: 1; }.calls strong { font-size: 13px; }.calls small { display: block; margin-top: 5px; font-size: 11px; color: #64748b; }.emergency, .normal { font-size: 10px; border-radius: 5px; padding: 6px 9px; }.emergency { color: #dc2626; background: #fef2f2; }.normal { color: #b45309; background: #fffbeb; }
@media(max-width: 1050px) { .metrics { grid-template-columns: 1fr 1fr; }.metric { padding: 15px; } }
@media(max-width: 900px) { .board { grid-template-columns: 1fr; }.board > section:last-child { height: 300px; } }
@media(max-width: 550px) { .metrics { gap: 10px; }.metricTop { font-size: 10px; }.calls article { flex-wrap: wrap; padding: 16px; }.calls article > button { width: 100%; }.date { display: none; } }
~~~~

## src/pages/Pacientes.jsx

~~~~jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRecursos } from '../hooks/useRecursos';
import { useCrud } from '../hooks/useCrud';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import styles from './Pacientes.module.css';
import ui from '../styles/ui.module.css';
const textMedical = value => typeof value === 'object' && value !== null ? JSON.stringify(value) : value || '';
function PacienteForm({ crud, areas, camas, pacientes }) {
  const patient = crud.editing;
  const [areaId, setAreaId] = useState(String(patient.area_id || ''));
  const [camaId, setCamaId] = useState(String(patient.cama_id || ''));
  const nurses = [...new Map(pacientes.filter(item => item.enfermero).map(item => [item.enfermero.id, item.enfermero])).values()];
  async function submit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    await crud.save({ nombre: form.nombre.trim(), dni: form.dni.trim(), datos_medicos: form.datos_medicos, area_id: Number(areaId), cama_id: camaId ? Number(camaId) : null, enfermero_asignado_id: form.enfermero_asignado_id.trim() || null });
  }
  return <form onSubmit={submit} className={ui.form}>
    <label className={ui.field}>Nombre completo<input name="nombre" defaultValue={patient.nombre || ''} required maxLength={160} disabled={crud.busy} /></label>
    <label className={ui.field}>DNI<input name="dni" inputMode="numeric" pattern="[0-9]{6,12}" title="Entre 6 y 12 dígitos" defaultValue={patient.dni || ''} required disabled={crud.busy} /></label>
    <label className={ui.field}>Datos médicos<textarea name="datos_medicos" defaultValue={textMedical(patient.datos_medicos)} disabled={crud.busy} /></label>
    <div className={ui.row}><label className={ui.field}>Área<select aria-label="Área" value={areaId} onChange={event => { setAreaId(event.target.value); setCamaId(''); }} required disabled={crud.busy}><option value="">Seleccionar área</option>{areas.map(area => <option value={area.id} key={area.id}>{area.nombre}</option>)}</select></label>
    <label className={ui.field}>Cama<select aria-label="Cama" value={camaId} onChange={event => setCamaId(event.target.value)} disabled={!areaId || crud.busy}><option value="">Sin cama asignada</option>{camas.filter(cama => String(cama.area_id) === areaId && !pacientes.some(item => String(item.cama_id) === String(cama.id) && item.id !== patient.id)).map(cama => <option value={cama.id} key={cama.id}>{cama.nombre}</option>)}</select></label></div>
    <label className={ui.field}>Enfermero asignado (ID)<input name="enfermero_asignado_id" list="enfermeros-conocidos" defaultValue={patient.enfermero_asignado_id || patient.enfermero_id || ''} placeholder="Opcional · ID del perfil" disabled={crud.busy} /><datalist id="enfermeros-conocidos">{nurses.map(nurse => <option key={nurse.id} value={nurse.id}>{nurse.nombre || nurse.email}</option>)}</datalist></label>
    {crud.error && <p className={ui.error} role="alert">{crud.error}</p>}
    <div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button><button className={ui.primary} disabled={crud.busy}>{crud.busy ? 'Guardando…' : 'Guardar paciente'}</button></div>
  </form>;
}
export default function Pacientes() {
  const { rol } = useAuth();
  const { data, loading, error, reload } = useRecursos(['/api/pacientes', '/api/areas', '/api/camas']);
  const crud = useCrud('/api/pacientes', reload);
  const [search, setSearch] = useState('');
  const pacientes = data['/api/pacientes'] || [];
  const areas = data['/api/areas'] || [];
  const camas = data['/api/camas'] || [];
  const columns = [
    { key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }, { key: 'dni', label: 'DNI' },
    { key: 'datos_medicos', label: 'Datos médicos', render: row => <span className={styles.medical} title={textMedical(row.datos_medicos)}>{textMedical(row.datos_medicos) || '—'}</span> },
    { key: 'cama_id', label: 'Cama', render: row => camas.find(item => item.id === row.cama_id)?.nombre || row.cama?.nombre || 'Sin asignar' },
    { key: 'area_id', label: 'Área', render: row => areas.find(item => item.id === row.area_id)?.nombre || row.area?.nombre || '—' },
    { key: 'enfermero_asignado_id', label: 'Enfermero', render: row => row.enfermero?.nombre || row.enfermero?.email || row.enfermero_asignado_id || row.enfermero_id || 'Sin asignar' },
  ];
  return <div className={styles.page}><div className={ui.header}><div><p className={ui.eyebrow}>GESTIÓN HOSPITALARIA</p><h1 className={ui.title}>Pacientes</h1><p className={ui.subtitle}>Información y asignaciones para una atención coordinada.</p></div>{rol === 'Administrador' && <button className={ui.primary} disabled={loading || Boolean(error)} onClick={() => crud.edit()}>＋ Nuevo Paciente</button>}</div>
    <div className={styles.toolbar}><input className={ui.search} aria-label="Buscar pacientes" placeholder="Buscar por nombre o DNI…" value={search} onChange={event => setSearch(event.target.value)} /><span>{pacientes.length} pacientes</span><button className={ui.secondary} onClick={reload} disabled={loading}>Actualizar</button></div>
    {error && <p className={ui.error} role="alert">{error}</p>}
    <TablaGenerica columns={columns} rows={pacientes.filter(row => `${row.nombre} ${row.dni}`.toLowerCase().includes(search.toLowerCase()))} loading={loading} actions={row => <><button className={ui.secondary} onClick={() => crud.edit(row)}>Editar</button>{rol === 'Administrador' && <button className={ui.danger} onClick={() => crud.remove(row)}>Eliminar</button>}</>} />
    {crud.editing && <Modal title={crud.editing.id ? 'Editar paciente' : 'Nuevo paciente'} onClose={crud.close}><PacienteForm crud={crud} areas={areas} camas={camas} pacientes={pacientes} /></Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
~~~~

## src/pages/Pacientes.module.css

~~~~css
.page { min-width: 0; }.toolbar { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }.toolbar input { max-width: 340px; }.toolbar span { font-size: 12px; color: #94a3b8; margin-left: auto; white-space: nowrap; }.medical { display: block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #64748b; }@media(max-width: 600px) { .toolbar { flex-wrap: wrap; }.toolbar input { max-width: none; }.toolbar span { margin-left: 0; margin-right: auto; } }
~~~~

## src/pages/Areas.jsx

~~~~jsx
import { useRecursos } from '../hooks/useRecursos';
import { useCrud } from '../hooks/useCrud';
import { TIPOS_AREA, NOMBRES_TIPO } from '../utils/constantes';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import styles from './Areas.module.css';
import ui from '../styles/ui.module.css';
export default function Areas() {
  const { data, loading, error, reload } = useRecursos(['/api/areas']);
  const crud = useCrud('/api/areas', reload);
  const rows = data['/api/areas'] || [];
  const columns = [{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }, { key: 'tipo', label: 'Tipo', render: row => <span className={ui.badge}>{NOMBRES_TIPO[row.tipo] || row.tipo}</span> }, ...[['coordenadas_x', 'X (%)'], ['coordenadas_y', 'Y (%)'], ['ancho', 'Ancho (%)'], ['alto', 'Alto (%)']].map(([key, label]) => ({ key, label }))];
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['coordenadas_x', 'coordenadas_y', 'ancho', 'alto']) values[key] = Number(values[key]);
    const form = event.currentTarget;
    const fits = values.coordenadas_x >= values.ancho / 2 && values.coordenadas_x + values.ancho / 2 <= 100 && values.coordenadas_y >= values.alto / 2 && values.coordenadas_y + values.alto / 2 <= 100;
    form.elements.ancho.setCustomValidity(fits ? '' : 'El área debe quedar dentro del plano (0–100%).');
    if (!form.reportValidity()) return;
    await crud.save({ ...values, nombre: values.nombre.trim() });
  }
  return <div className={styles.page}><div className={ui.header}><div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>Áreas del hospital</h1><p className={ui.subtitle}>Organizá los espacios y su ubicación en el plano.</p></div><button className={ui.primary} onClick={() => crud.edit()}>＋ Nueva Área</button></div>
    <p className={styles.hint}>Las coordenadas indican el centro de cada área. Todas las medidas se expresan en porcentajes del plano.</p>
    {error && <p className={ui.error} role="alert">{error} <button className={ui.secondary} onClick={reload}>Reintentar</button></p>}
    <TablaGenerica columns={columns} rows={rows} loading={loading} actions={row => <><button className={ui.secondary} onClick={() => crud.edit(row)}>Editar</button><button className={ui.danger} onClick={() => crud.remove(row)}>Eliminar</button></>} />
    {crud.editing && <Modal title={crud.editing.id ? 'Editar área' : 'Nueva área'} onClose={crud.close}><form className={ui.form} onSubmit={submit} onChange={event => event.currentTarget.elements.ancho.setCustomValidity('')}>
      <label className={ui.field}>Nombre<input name="nombre" defaultValue={crud.editing.nombre || ''} required maxLength={120} disabled={crud.busy} /></label>
      <label className={ui.field}>Tipo<select name="tipo" defaultValue={crud.editing.tipo || 'Habitacion'} disabled={crud.busy}>{TIPOS_AREA.map(tipo => <option key={tipo} value={tipo}>{NOMBRES_TIPO[tipo]}</option>)}</select></label>
      <div className={styles.geometry}>{[['coordenadas_x', 'Centro X', 50], ['coordenadas_y', 'Centro Y', 50], ['ancho', 'Ancho', 20], ['alto', 'Alto', 18]].map(([key, label, fallback]) => <label key={key} className={ui.field}>{label} (%)<input type="number" name={key} min={key === 'ancho' || key === 'alto' ? .1 : 0} max="100" step=".1" defaultValue={crud.editing[key] ?? fallback} required disabled={crud.busy} /></label>)}</div>
      {crud.error && <p className={ui.error} role="alert">{crud.error}</p>}<div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button><button className={ui.primary} disabled={crud.busy}>{crud.busy ? 'Guardando…' : 'Guardar área'}</button></div>
    </form></Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
~~~~

## src/pages/Areas.module.css

~~~~css
.page { min-width: 0; }.hint { font-size: 12px; line-height: 1.6; color: #64748b; margin-bottom: 22px; }.geometry { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
~~~~

## src/pages/Usuarios.jsx

~~~~jsx
import { useState } from 'react';
import { useRecursos } from '../hooks/useRecursos';
import api, { mensajeError } from '../services/api';
import { ROLES } from '../utils/constantes';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import styles from './Usuarios.module.css';
import ui from '../styles/ui.module.css';
export default function Usuarios() {
  const { data, loading, error, reload } = useRecursos(['/api/usuarios']);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState([]);
  const [success, setSuccess] = useState('');
  const rows = [...new Map([...(data['/api/usuarios'] || []), ...created].map(row => [row.id, row])).values()];
  async function submit(event) {
    event.preventDefault(); setBusy(true); setFormError('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data: result } = await api.post('/api/auth/register', { ...form, email: form.email.trim() });
      setCreated(previous => [...previous, result.usuario || result]); setOpen(false);
      setSuccess(`Usuario ${form.email} creado correctamente.`); reload();
    } catch (err) { setFormError(mensajeError(err)); }
    finally { setBusy(false); }
  }
  return <div className={styles.page}><div className={ui.header}><div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>Usuarios</h1><p className={ui.subtitle}>Administrá el acceso del equipo hospitalario.</p></div><button className={ui.primary} onClick={() => { setOpen(true); setFormError(''); }}>＋ Nuevo Usuario</button></div>
    {error && <div className={ui.error} role="alert">No se pudo cargar el directorio de usuarios: {error}<button className={ui.secondary} onClick={reload}>Reintentar</button></div>}
    {success && <p className={ui.notice} role="status">{success}</p>}
    <TablaGenerica rows={rows} loading={loading} empty={error ? 'Directorio no disponible. Los usuarios creados en esta sesión se mostrarán aquí.' : 'No hay usuarios registrados.'} columns={[{ key: 'email', label: 'Email' }, { key: 'rol', label: 'Rol', render: row => <span className={ui.badge}>{row.rol}</span> }]} />
    <p className={styles.note}>Los administradores pueden gestionar áreas y usuarios. El personal de salud accede al monitoreo, pacientes y reportes.</p>
    {open && <Modal title="Nuevo usuario" onClose={() => { if (!busy) setOpen(false); }}><form className={ui.form} onSubmit={submit}><label className={ui.field}>Email<input type="email" name="email" required autoComplete="off" disabled={busy} /></label><label className={ui.field}>Contraseña<input aria-label="Contraseña" type="password" name="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy} /><small>Entre 12 y 128 caracteres.</small></label><label className={ui.field}>Rol<select name="rol" defaultValue="Generico" disabled={busy}>{ROLES.map(rol => <option key={rol} value={rol}>{rol === 'Generico' ? 'Genérico · Personal de salud' : rol}</option>)}</select></label>{formError && <p className={ui.error} role="alert">{formError}</p>}<div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={busy} onClick={() => setOpen(false)}>Cancelar</button><button className={ui.primary} disabled={busy}>{busy ? 'Creando…' : 'Crear usuario'}</button></div></form></Modal>}
  </div>;
}
~~~~

## src/pages/Usuarios.module.css

~~~~css
.page { min-width: 0; }.note { font-size: 12px; color: #64748b; margin-top: 22px; line-height: 1.7; }
~~~~

## src/pages/Reportes.jsx

~~~~jsx
import { useEffect, useMemo, useState } from 'react';
import { useRecursos } from '../hooks/useRecursos';
import api, { listarTodos, mensajeError } from '../services/api';
import { filtrosReporte } from '../utils/formateoFechas';
import { normalizarEstadisticas, respuestaPorDia } from '../utils/reportes';
import GraficoBarras from '../components/GraficoBarras';
import GraficoPastel from '../components/GraficoPastel';
import GraficoLineas from '../components/GraficoLineas';
import styles from './Reportes.module.css';
import ui from '../styles/ui.module.css';
export default function Reportes() {
  const areas = useRecursos(['/api/areas']);
  const [filters, setFilters] = useState({ area_id: '', origen: '', desde: '', hasta: '' });
  const [state, setState] = useState({ loading: true, data: null, error: '', lineError: '' });
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');
  const [revision, setRevision] = useState(0);
  const invalid = Boolean(filters.desde && filters.hasta && filters.desde > filters.hasta);
  const params = useMemo(() => filtrosReporte(filters), [filters]);
  useEffect(() => {
    if (invalid) return;
    const controller = new AbortController();
    async function load() {
      setState({ loading: true, data: null, error: '', lineError: '' });
      try {
        const response = await api.get('/api/reportes/estadisticas', { params, signal: controller.signal });
        const data = normalizarEstadisticas(response.data);
        let lineError = '';
        if (!data.por_dia) {
          try { data.por_dia = respuestaPorDia(await listarTodos('/api/llamados', params, controller.signal)); }
          catch (err) { if (controller.signal.aborted) return; data.por_dia = []; lineError = mensajeError(err); }
        }
        if (!controller.signal.aborted) setState({ loading: false, data, error: '', lineError });
      } catch (err) { if (!controller.signal.aborted) setState({ loading: false, data: null, error: mensajeError(err), lineError: '' }); }
    }
    const timer = setTimeout(load, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [params, invalid, revision]);
  function change(event) { setFilters(previous => ({ ...previous, [event.target.name]: event.target.value })); }
  async function download(format) {
    setExporting(format); setExportError('');
    try {
      const response = await api.get(`/api/reportes/export/${format}`, { params, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url; link.download = `codigo-azul-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try { err.response.data = JSON.parse(await err.response.data.text()); } catch { /* El servidor puede responder texto o HTML. */ }
      }
      setExportError(mensajeError(err));
    } finally { setExporting(''); }
  }
  return <><div className={ui.header}><div><p className={ui.eyebrow}>ANÁLISIS Y SEGUIMIENTO</p><h1 className={ui.title}>Reportes</h1><p className={ui.subtitle}>Información para mejorar cada respuesta.</p></div><div className={ui.actions}><button className={ui.secondary} onClick={() => download('pdf')} disabled={Boolean(exporting) || invalid}>{exporting === 'pdf' ? 'Exportando…' : '📄 Exportar PDF'}</button><button className={ui.primary} onClick={() => download('csv')} disabled={Boolean(exporting) || invalid}>{exporting === 'csv' ? 'Exportando…' : '📊 Exportar CSV'}</button></div></div>
    <div className={styles.filters}><label className={ui.field}>Área<select aria-label="Área" name="area_id" value={filters.area_id} onChange={change}><option value="">Todas las áreas</option>{(areas.data['/api/areas'] || []).map(area => <option value={area.id} key={area.id}>{area.nombre}</option>)}</select></label><label className={ui.field}>Origen<select aria-label="Origen" name="origen" value={filters.origen} onChange={change}><option value="">Todos los orígenes</option><option value="Cama">Cama</option><option value="Baño">Baño</option></select></label><label className={ui.field}>Desde<input type="date" name="desde" value={filters.desde} onChange={change} max={filters.hasta || undefined} /></label><label className={ui.field}>Hasta<input type="date" name="hasta" value={filters.hasta} onChange={change} min={filters.desde || undefined} /></label></div>
    {areas.error && <p className={ui.error} role="alert">{areas.error}</p>}
    {(invalid || state.error || exportError) && <p className={ui.error} role="alert">{invalid ? 'La fecha desde debe ser anterior o igual a la fecha hasta.' : state.error || exportError}{state.error && <button className={ui.secondary} onClick={() => setRevision(value => value + 1)}>Reintentar</button>}</p>}
    {state.loading && !invalid ? <p className={ui.empty} role="status">Cargando estadísticas…</p> : !invalid && state.data && <>
      <div className={styles.totals}><article><span>Total de llamados</span><strong>{state.data.total_llamados ?? '—'}</strong></article><article><span>Atendidos</span><strong>{state.data.atendidos ?? '—'}</strong></article><article><span>Tiempo promedio</span><strong>{state.data.tiempo_promedio_respuesta_segundos ?? state.data.tiempo_promedio_respuesta_seg ?? '—'} <small>s</small></strong></article></div>
      <div className={styles.charts}><section><h2>Llamados por área</h2><p>Distribución de solicitudes en el hospital</p><GraficoBarras data={state.data.por_area} /></section><section><h2>Tipo de llamado</h2><p>Normales y emergencias</p><GraficoPastel data={state.data.por_tipo} /></section><section className={styles.wide}><h2>Tiempo de respuesta</h2><p>Promedio en segundos por día de activación · horario local</p>{state.lineError ? <p className={ui.error} role="alert">{state.lineError}</p> : <GraficoLineas data={state.data.por_dia || []} />}</section></div>
    </>}
  </>;
}
~~~~

## src/pages/Reportes.module.css

~~~~css
.filters { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 18px; padding: 22px; border: 1px solid #e2e8f0; background: white; border-radius: 10px; margin-bottom: 24px; }.totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 24px; }.totals article { background: white; border: 1px solid #e2e8f0; padding: 22px; border-radius: 10px; }.totals span { font-size: 12px; color: #64748b; }.totals strong { display: block; margin-top: 12px; font-size: 28px; letter-spacing: -.7px; }.totals small { font-size: 14px; color: #94a3b8; font-weight: 400; }.charts { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }.charts section { min-width: 0; padding: 24px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; }.charts h2 { font-size: 15px; margin-bottom: 6px; }.charts p { font-size: 11px; color: #94a3b8; }.wide { grid-column: 1 / -1; }@media(max-width: 1000px) { .filters { grid-template-columns: 1fr 1fr; } }@media(max-width: 650px) { .charts, .totals { grid-template-columns: 1fr; }.filters { padding: 16px; gap: 12px; }.totals { gap: 10px; }.totals article { padding: 16px; }.wide { grid-column: auto; } }
~~~~

## src/components/ConfirmarEliminar.jsx

~~~~jsx
import Modal from './Modal';
import ui from '../styles/ui.module.css';
export default function ConfirmarEliminar({ crud }) {
  if (!crud.deleting) return null;
  return <Modal title="Eliminar registro" onClose={crud.close}><p className={ui.subtitle}>Se eliminará «{crud.deleting.nombre}». Esta acción no se puede deshacer.</p>{crud.error && <p className={ui.error} role="alert">{crud.error}</p>}<div className={ui.formFooter}><button className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button><button className={ui.danger} disabled={crud.busy} onClick={crud.confirmDelete}>{crud.busy ? 'Eliminando…' : 'Eliminar'}</button></div></Modal>;
}
~~~~

## src/components/Icon.jsx

~~~~jsx
const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  pacientes: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87',
  areas: 'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16',
  usuarios: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z M9 12l2 2 4-4',
  reportes: 'M3 3v18h18 M7 16v-5 M12 16V7 M17 16v-8',
  logout: 'M9 21H3V3h6 M9 12h12 M17 8l4 4-4 4',
  pulse: 'M2 12h5l3-8 4 16 3-8h5',
  clock: 'M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  bed: 'M3 18V6 M3 12h18v6 M3 15h18 M7 12V8h5v4 M21 18v2 M3 18v2',
};
export default function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.pulse} /></svg>;
}
~~~~

## src/context/contexts.js

~~~~javascript
import { createContext } from 'react';
export const AuthContext = createContext(null);
export const SocketContext = createContext(null);
~~~~

## src/hooks/useCrud.js

~~~~javascript
import { useState } from 'react';
import api, { mensajeError } from '../services/api';
export function useCrud(path, reload) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function edit(row = {}) { setError(''); setEditing(row); }
  function remove(row) { setError(''); setDeleting(row); }
  function close() { if (!busy) { setEditing(null); setDeleting(null); setError(''); } }
  async function save(payload) {
    setBusy(true); setError('');
    try {
      if (editing.id != null) await api.put(`${path}/${editing.id}`, payload);
      else await api.post(path, payload);
      setEditing(null); reload(); return true;
    } catch (err) { setError(mensajeError(err)); return false; }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    setBusy(true); setError('');
    try { await api.delete(`${path}/${deleting.id}`); setDeleting(null); reload(); }
    catch (err) { setError(mensajeError(err)); }
    finally { setBusy(false); }
  }
  return { editing, deleting, busy, error, edit, remove, close, save, confirmDelete };
}
~~~~

## src/hooks/useRecursos.js

~~~~javascript
import { useCallback, useEffect, useState } from 'react';
import { listarTodos, mensajeError } from '../services/api';
export function useRecursos(paths) {
  const key = JSON.stringify(paths);
  const [state, setState] = useState({ data: {}, loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: true, error: '' }));
    });
    Promise.all(JSON.parse(key).map(async path => [path, await listarTodos(path, {}, controller.signal)]))
      .then(entries => { if (!controller.signal.aborted) setState({ data: Object.fromEntries(entries), loading: false, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: mensajeError(error) })); });
    return () => controller.abort();
  }, [key, revision]);
  return { ...state, reload };
}
~~~~

## src/styles/global.module.css

~~~~css
:global(*) { box-sizing: border-box; }
:global(:root) { font-family: Inter, 'Segoe UI', sans-serif; color: #1e293b; background: #f5f7fa; font-synthesis: none; text-rendering: optimizeLegibility; --accent: #3b82f6; --danger: #ef4444; --success: #10b981; }
:global(body) { margin: 0; min-width: 360px; }
:global(button), :global(input), :global(select), :global(textarea) { font: inherit; }
:global(button), :global(a), :global(input), :global(select), :global(textarea) { -webkit-tap-highlight-color: transparent; }
:global(button) { cursor: pointer; }
:global(button:disabled) { cursor: wait; opacity: .55; }
:global(a) { color: inherit; text-decoration: none; }
:global(h1), :global(h2), :global(h3), :global(p) { margin-top: 0; }
:global(button:focus-visible), :global(a:focus-visible), :global(input:focus-visible), :global(select:focus-visible), :global(textarea:focus-visible) { outline: 3px solid #93c5fd; outline-offset: 3px; }
:global(::selection) { background: #dbeafe; }
~~~~

## src/styles/ui.module.css

~~~~css
.header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 26px; }
.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 1.7px; color: #64748b; text-transform: uppercase; margin-bottom: 9px; }
.title { font-size: clamp(24px, 2.2vw, 32px); letter-spacing: -1px; font-weight: 700; margin-bottom: 8px; }
.subtitle { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 0; }
.primary, .secondary, .danger { border-radius: 8px; padding: 11px 16px; font-size: 13px; font-weight: 600; border: 1px solid transparent; }
.primary { background: #3b82f6; color: white; box-shadow: 0 3px 7px #3b82f61a; }
.primary:hover { background: #2563eb; }
.secondary { background: white; border-color: #dce3ed; color: #475569; }
.danger { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
.actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
.error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; padding: 12px 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; margin: 12px 0; }
.notice { color: #475569; background: #eff6ff; border: 1px solid #dbeafe; padding: 12px 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; }
.form { display: grid; gap: 17px; }
.field { display: grid; gap: 7px; font-size: 13px; font-weight: 600; color: #475569; }
.field input, .field select, .field textarea, .search { width: 100%; min-height: 42px; border-radius: 7px; border: 1px solid #dbe1ea; background: white; color: #1e293b; padding: 10px 12px; font-weight: 400; }
.field textarea { min-height: 90px; resize: vertical; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.formFooter { display: flex; gap: 10px; justify-content: flex-end; padding-top: 8px; }
.empty { color: #64748b; padding: 40px 16px; text-align: center; font-size: 14px; }
.badge { display: inline-flex; padding: 5px 9px; border-radius: 6px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 600; }
@media(max-width: 700px) { .header { align-items: flex-start; flex-direction: column; } .row { grid-template-columns: 1fr; } }
~~~~

## src/utils/imagenesAreas.js

~~~~javascript
const pngs = import.meta.glob('../assets/{recepcion,secretaria,sala_espera,enfermeria,pasillo,quirofano,bano,habitacion1,habitacion2}.png', { eager: true, query: '?url', import: 'default' });
const names = { Recepcion: 'recepcion', Secretaria: 'secretaria', SalaEspera: 'sala_espera', Enfermeria: 'enfermeria', Pasillo: 'pasillo', Quirofano: 'quirofano', Bano: 'bano' };
export function imagenArea(area) {
  const name = area.tipo === 'Habitacion' ? (/1|3/.test(area.nombre) ? 'habitacion1' : 'habitacion2') : names[area.tipo];
  return pngs[`../assets/${name}.png`] || planoVectorial(area.tipo);
}
export function planoVectorial(tipo) {
  const furniture = tipo === 'Habitacion' ? '<rect x="15" y="34" width="24" height="40" rx="3"/><path d="M15 45h24M18 39h18"/><rect x="65" y="34" width="24" height="40" rx="3"/><path d="M65 45h24M68 39h18"/>' :
    tipo === 'Quirofano' ? '<rect x="39" y="30" width="25" height="49" rx="10"/><circle cx="51" cy="22" r="7"/><path d="M21 45h12M70 45h12M51 79v9"/>' :
    tipo === 'SalaEspera' ? '<path d="M15 35h70M15 42h70M15 62h70M15 69h70M25 32v13M45 32v13M65 32v13M25 59v13M45 59v13M65 59v13"/>' :
    tipo === 'Bano' ? '<ellipse cx="50" cy="52" rx="13" ry="18"/><rect x="37" y="27" width="26" height="13" rx="3"/>' :
    tipo === 'Pasillo' ? '<path d="M8 50h84" stroke-dasharray="4 4"/>' :
    '<path d="M17 35h65v28H65V49H34v26H17z"/><circle cx="48" cy="66" r="7"/>';
  const fill = tipo === 'Pasillo' ? '#f1f5f9' : tipo === 'Quirofano' ? '#eaf5f6' : '#f4f8fd';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect x="1" y="1" width="98" height="98" rx="3" fill="${fill}" stroke="#b7c9db" stroke-width="1.5"/><g fill="#e1ebf4" stroke="#a2b8ce" stroke-width="1.4">${furniture}</g><path d="M43 99h15" stroke="white" stroke-width="3"/></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
~~~~

## src/utils/reportes.js

~~~~javascript
export function normalizarEstadisticas(data) {
  return {
    ...data,
    por_area: (data.por_area || []).map(row => ({ nombre: row.nombre || row.area_nombre || row.area?.nombre || `Área #${row.area_id}`, cantidad: Number(row.cantidad ?? row.total_llamados ?? row.total ?? 0) })),
    por_tipo: (data.por_tipo || []).map(row => ({ nombre: row.tipo || row.nombre, cantidad: Number(row.cantidad ?? row.total_llamados ?? row.total ?? 0) })),
    por_dia: data.por_dia?.map(row => ({ fecha: row.fecha || row.dia, promedio: row.promedio ?? row.tiempo_promedio_respuesta_segundos ?? row.tiempo_promedio_respuesta_seg ?? null })),
  };
}
export function respuestaPorDia(llamados) {
  const groups = new Map();
  for (const call of llamados) {
    const seconds = call.tiempo_respuesta_segundos ?? call.tiempo_respuesta_seg;
    if (call.estado !== 'Atendido' || seconds == null || !Number.isFinite(Number(seconds))) continue;
    const date = new Date(call.fecha_hora_activacion || call.fecha_activacion);
    if (Number.isNaN(date.getTime())) continue;
    const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const group = groups.get(key) || { total: 0, count: 0 };
    group.total += Number(seconds); group.count++; groups.set(key, group);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([fecha, group]) => ({ fecha, promedio: Math.round(group.total / group.count * 10) / 10 }));
}
~~~~

## tests/frontend.spec.js

~~~~javascript
import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { PLANO_REFERENCIA } from '../src/utils/constantes.js';
import { respuestaPorDia } from '../src/utils/reportes.js';
let http;
let io;
test.beforeAll(async () => {
  http = createServer();
  io = new Server(http, { cors: { origin: '*' } });
  await new Promise(resolve => http.listen(3099, '127.0.0.1', resolve));
});
test.afterAll(async () => { await new Promise(resolve => io.close(resolve)); });
async function setup(page, { rol = 'Administrador', authenticated = true, active = [], delayActive = 0 } = {}) {
  const usuario = { id: 'nurse-1', email: 'equipo@hospital.test', rol };
  const areas = PLANO_REFERENCIA.map((area, index) => ({ ...area, id: index + 1 }));
  const camas = [{ id: 1, area_id: 9, nombre: 'Cama 1', coordenadas_x: 51, coordenadas_y: 57 }];
  let pacientes = [{ id: 1, nombre: 'Paciente de prueba', dni: '12345678', datos_medicos: 'Observación', area_id: 9, cama_id: 1, enfermero_asignado_id: 'nurse-1', enfermero: usuario }];
  const calls = [];
  await page.addInitScript(({ authenticated }) => { if (authenticated) localStorage.setItem('codigoAzul.token', 'test-token'); }, { authenticated });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url()); const path = url.pathname;
    const body = request.postDataJSON();
    calls.push({ path, method: request.method(), body, params: Object.fromEntries(url.searchParams) });
    let result;
    if (path === '/api/auth/me') result = usuario;
    else if (path === '/api/auth/login') {
      if (body.password === 'incorrecta') return route.fulfill({ status: 401, json: { error: 'Credenciales inválidas' } });
      result = { token: 'test-token', usuario };
    } else if (path === '/api/areas') result = areas;
    else if (path === '/api/camas') result = camas;
    else if (path === '/api/usuarios') result = [usuario];
    else if (path === '/api/auth/register') result = { id: 'new-user', email: body.email, rol: body.rol };
    else if (path === '/api/pacientes' && request.method() === 'POST') {
      result = { ...body, id: 2 }; pacientes.push(result);
    } else if (path.startsWith('/api/pacientes/') && request.method() === 'PUT') {
      result = { ...body, id: Number(path.split('/').at(-1)) }; pacientes = pacientes.map(row => row.id === result.id ? result : row);
    } else if (path.startsWith('/api/pacientes/') && request.method() === 'DELETE') {
      pacientes = pacientes.filter(row => row.id !== Number(path.split('/').at(-1))); return route.fulfill({ status: 204 });
    } else if (path === '/api/pacientes') result = pacientes;
    else if (path === '/api/llamados/activos') { if (delayActive) await new Promise(resolve => setTimeout(resolve, delayActive)); result = active; }
    else if (path.endsWith('/atender')) { result = {}; io.emit('llamadoAtendido', { id: Number(path.split('/').at(-2)), enfermero: usuario, tiempo_respuesta_segundos: 15 }); }
    else if (path === '/api/reportes/estadisticas') result = { total_llamados: 2, atendidos: 1, tiempo_promedio_respuesta_seg: 15, por_area: [{ nombre: 'Habitación 1', total_llamados: 2 }], por_tipo: [{ tipo: 'Normal', total_llamados: 1 }, { tipo: 'Emergencia', total_llamados: 1 }], por_dia: [{ fecha: '2026-09-29', promedio: 15 }] };
    else if (path === '/api/reportes/export/csv') return route.fulfill({ contentType: 'text/csv', body: 'id,nombre\n1,Prueba' });
    else result = [];
    await route.fulfill({ json: Array.isArray(result) ? { data: result, total: result.length, page: 1, limit: 500 } : result });
  });
  return { calls, areas };
}
test('login, errores del backend y cierre de sesión', async ({ page }) => {
  await setup(page, { authenticated: false });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('Correo electrónico').fill('equipo@hospital.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
  await expect(page.getByRole('alert')).toHaveText('Credenciales inválidas');
  await page.getByLabel('Contraseña', { exact: true }).fill('correcta');
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
  await expect(page.getByRole('heading', { name: 'Todo el hospital, conectado.' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/login/);
  expect(await page.evaluate(() => localStorage.getItem('codigoAzul.token'))).toBeNull();
});
test('permisos de usuario genérico y expiración de sesión', async ({ page }) => {
  await setup(page, { rol: 'Generico' });
  await page.goto('/usuarios');
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Pacientes', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Paciente de prueba', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo Paciente' })).toHaveCount(0);
  await page.route('**/api/pacientes*', route => route.fulfill({ status: 401, json: { error: 'Token expirado' } }));
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(page).toHaveURL(/login/);
});
test('CRUD pacientes, contrato español y cierre accesible del modal', async ({ page }) => {
  const { calls } = await setup(page);
  await page.goto('/pacientes');
  await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
  await page.getByLabel('Nombre completo').fill('Ana Prueba');
  await page.getByLabel('DNI', { exact: true }).fill('23456789');
  await page.getByLabel('Área', { exact: true }).selectOption('10');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page.getByRole('cell', { name: 'Ana Prueba', exact: true })).toBeVisible();
  expect(calls.find(call => call.path === '/api/pacientes' && call.method === 'POST').body).toMatchObject({ area_id: 10, enfermero_asignado_id: null, cama_id: null });
  const row = page.getByRole('row').filter({ hasText: 'Ana Prueba' });
  await row.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Nombre completo').fill('Ana Editada');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  const edited = page.getByRole('row').filter({ hasText: 'Ana Editada' });
  await expect(edited).toBeVisible();
  await edited.getByRole('button', { name: 'Eliminar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Ana Editada' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nuevo Paciente' })).toBeFocused();
  await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
  await page.mouse.click(5, 5);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('geometría, eventos en vivo, atención y overlay de tres segundos', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await setup(page);
  await page.goto('/dashboard');
  await expect(page.getByText('Llamados activos sincronizados.', { exact: false })).toBeVisible();
  const image = page.getByRole('img', { name: 'Recepción', exact: true });
  await expect(image).toHaveCSS('position', 'absolute');
  expect(await image.evaluate(element => element.style.left)).toBe('12%');
  const event = { id: 42, paciente_id: 1, area_id: 9, paciente: { nombre: 'Paciente de prueba' }, area: { nombre: 'Habitación 1' }, tipo: 'Emergencia', origen: 'Cama', fecha_hora_activacion: new Date().toISOString() };
  io.emit('nuevoLlamado', event); io.emit('codigoAzul', event);
  await expect(page.getByRole('alert').filter({ hasText: 'CÓDIGO AZUL' })).toBeVisible();
  await expect(page.getByLabel('Paciente de prueba · Llamado activo', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'CÓDIGO AZUL' })).toHaveCount(0, { timeout: 5000 });
  await page.getByRole('button', { name: 'Atender llamado' }).click();
  await expect(page.getByText('No hay llamados pendientes')).toBeVisible();
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
});
test('la sincronización conserva eventos recibidos durante el fetch', async ({ page }) => {
  const call = { id: 6, paciente_id: 1, area_id: 9, tipo: 'Normal', origen: 'Cama', paciente: { nombre: 'Paciente de prueba' } };
  await setup(page, { active: [call], delayActive: 600 });
  await page.goto('/dashboard');
  await expect(page.getByText('Conexión establecida. Sincronizando', { exact: false })).toBeVisible();
  io.emit('llamadoAtendido', { id: 6, tiempo_respuesta_segundos: 5 });
  await expect(page.getByText('Llamados activos sincronizados.', { exact: false })).toBeVisible();
  await expect(page.getByText('No hay llamados pendientes')).toBeVisible();
});
test('reportes filtran, muestran gráficos y descargan CSV', async ({ page }) => {
  const { calls } = await setup(page);
  await page.goto('/reportes');
  await expect(page.getByRole('heading', { name: 'Llamados por área' })).toBeVisible();
  await page.getByLabel('Área', { exact: true }).selectOption('9');
  await page.getByLabel('Origen', { exact: true }).selectOption('Baño');
  await page.getByLabel('Desde', { exact: true }).fill('2026-09-01');
  await page.getByLabel('Hasta', { exact: true }).fill('2026-09-29');
  await expect.poll(() => calls.filter(call => call.path.endsWith('/estadisticas')).at(-1)?.params).toMatchObject({ area_id: '9', origen: 'Baño', fecha_desde: expect.any(String), fecha_hasta: expect.any(String) });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/codigo-azul-.*\.csv/);
});
test('usuario nuevo y adaptación móvil sin desbordamiento', async ({ page }) => {
  const { calls } = await setup(page);
  await page.goto('/usuarios');
  await page.getByRole('button', { name: 'Nuevo Usuario' }).click();
  await page.getByLabel('Email', { exact: true }).fill('nuevo@hospital.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('password-de-prueba');
  await page.getByRole('button', { name: 'Crear usuario' }).click();
  await expect(page.getByRole('cell', { name: 'nuevo@hospital.test' })).toBeVisible();
  expect(calls.find(call => call.path === '/api/auth/register').body.rol).toBe('Generico');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Mapa del hospital' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
});
test('promedio diario excluye llamados no atendidos y conserva cero segundos', () => {
  const data = respuestaPorDia([
    { estado: 'Atendido', fecha_hora_activacion: '2026-09-29T12:00:00Z', tiempo_respuesta_segundos: 0 },
    { estado: 'Atendido', fecha_activacion: '2026-09-29T12:00:00Z', tiempo_respuesta_seg: 20 },
    { estado: 'No Atendido', fecha_activacion: '2026-09-29T12:00:00Z', tiempo_respuesta_seg: null },
  ]);
  expect(data).toEqual([{ fecha: '2026-09-29', promedio: 10 }]);
});
~~~~

## scripts/export-code.mjs

~~~~javascript
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const order = ['package.json', '.env.example', 'index.html', 'src/main.jsx', 'src/index.css', 'src/App.jsx', 'src/App.css',
  'src/services/api.js', 'src/services/socket.js', 'src/context/AuthContext.jsx', 'src/context/SocketContext.jsx',
  'src/hooks/useAuth.js', 'src/hooks/useSocket.js', 'src/utils/formateoFechas.js', 'src/utils/constantes.js'];
for (const name of ['ProtectedRoute', 'Layout', 'Sidebar', 'Modal', 'Avatar', 'AreaMapa', 'MapaHospital', 'Consola', 'TablaGenerica', 'GraficoBarras', 'GraficoPastel', 'GraficoLineas']) {
  order.push(`src/components/${name}.jsx`);
  if (!['ProtectedRoute', 'GraficoBarras', 'GraficoPastel', 'GraficoLineas'].includes(name)) order.push(`src/components/${name}.module.css`);
}
for (const name of ['Login', 'Dashboard', 'Pacientes', 'Areas', 'Usuarios', 'Reportes']) order.push(`src/pages/${name}.jsx`, `src/pages/${name}.module.css`);
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'assets') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(relative(root, path).replaceAll('\\', '/'));
  }
  return result;
}
for (const directory of ['src', 'tests', 'scripts']) order.push(...await walk(resolve(root, directory)));
order.push('vite.config.js', 'eslint.config.js', 'playwright.config.js', 'vercel.json', '.gitignore', 'README.md');
const fences = { '.js': 'javascript', '.mjs': 'javascript', '.jsx': 'jsx', '.css': 'css', '.json': 'json', '.html': 'html', '.md': 'markdown' };
const sections = [];
for (const path of new Set(order)) {
  const content = await readFile(resolve(root, path), 'utf8');
  sections.push(`## ${path}\n\n~~~~${fences[extname(path)] || 'text'}\n${content.trimEnd()}\n~~~~\n`);
}
await writeFile(resolve(root, 'CODIGO_FRONTEND.md'), sections.join('\n'), 'utf8');
console.log('CODIGO_FRONTEND.md generado con ' + sections.length + ' archivos.');
~~~~

## vite.config.js

~~~~javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
~~~~

## eslint.config.js

~~~~javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'test-results', 'playwright-report']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.mjs', 'playwright.config.js'],
    languageOptions: { globals: globals.node },
  },
])
~~~~

## playwright.config.js

~~~~javascript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5179', browserName: 'chromium', channel: 'msedge', viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5179 --strictPort',
    url: 'http://127.0.0.1:5179',
    reuseExistingServer: false,
    env: { VITE_API_URL: 'http://127.0.0.1:3099', VITE_SOCKET_URL: 'http://127.0.0.1:3099' },
  },
});
~~~~

## vercel.json

~~~~json
{"rewrites":[{"source":"/((?!assets/).*)","destination":"/index.html"}]}
~~~~

## .gitignore

~~~~text
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
test-results/
playwright-report/
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
~~~~

## README.md

~~~~markdown
# Código Azul — Frontend

React + Vite, JavaScript, React Router DOM v6, Context API, Axios, Socket.IO, Recharts, Framer Motion y CSS Modules.

## Inicio

Desde la raíz del repositorio, con Node.js 24:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

En Linux/macOS: `cp .env.example .env`. Abrir http://localhost:5173. Ejecutar el backend en otra terminal con su configuración propia. No hay credenciales predeterminadas ni datos simulados en la aplicación.

```dotenv
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Usar orígenes sin el sufijo /api. Reiniciar Vite después de cambiar variables. Autorizar el origen del frontend en CORS del backend.

## Verificación

```sh
npm run lint
npm test
npm run build
npm run preview
npm run export:code
```

Build: dist/. Las pruebas usan Edge instalado, respuestas HTTP simuladas y Socket.IO real en los puertos 5179 y 3099. No requieren credenciales ni datos reales. Para Chromium, quitar `channel: 'msedge'` de playwright.config.js y ejecutar `npx playwright install chromium`. Capturas: test-results/. El último comando genera CODIGO_FRONTEND.md con los archivos completos en el orden solicitado.

## Contrato e integración pendiente

**El backend existente necesita adaptar su contrato para completar la integración.** El frontend implementa los nombres exactos del pedido.

| Recurso | Frontend solicitado | Backend existente |
| --- | --- | --- |
| Coordenadas | coordenadas_x, coordenadas_y | coord_x, coord_y |
| Dimensiones de áreas | ancho, alto | No se persisten |
| Tipos de área | Ocho tipos | Faltan Secretaria, Enfermeria, Pasillo |
| Enfermero del paciente | enfermero_asignado_id | enfermero_id |
| Origen | Cama / Baño | Cama / Bano |
| Listado de perfiles | GET /api/usuarios, solo admin | No implementado |

Las escrituras mantienen el contrato solicitado. Alinear las validaciones y campos del backend antes de usar altas/ediciones de áreas y asignaciones. El mapa puede leer coord_x/coord_y y usar dimensiones de referencia para áreas conocidas; la tabla muestra los datos persistidos. La lectura admite enfermero_id, fecha_activacion y tiempo_respuesta_seg como aliases.

GET /api/usuarios debe devolver perfiles { id, email, rol }. Ante su ausencia, se muestra un error y el registro POST /api/auth/register sigue disponible; los perfiles creados se muestran durante la sesión. Los enfermeros del mapa se deducen de asignaciones de pacientes, no de ubicación física en vivo. El formulario admite el ID del perfil y sugiere perfiles conocidos.

Se respetan los permisos del backend existente: crear/eliminar pacientes, gestionar áreas y registrar usuarios requieren Administrador; Generico puede editar pacientes. El backend debe validar permisos en cada operación.

## Endpoints

- POST /api/auth/login, GET /api/auth/me, POST /api/auth/register.
- GET/POST /api/pacientes; PUT/DELETE /api/pacientes/:id.
- GET/POST /api/areas; PUT/DELETE /api/areas/:id; GET /api/camas.
- GET /api/usuarios.
- GET /api/llamados/activos, GET /api/llamados, PUT /api/llamados/:id/atender.
- GET /api/reportes/estadisticas, /api/reportes/export/pdf y /api/reportes/export/csv.

Los listados admiten arrays directos o { data, total, page, limit }; se recorren todas las páginas.

## Reportes

Respuesta esperada:

```json
{
  "total_llamados": 12,
  "atendidos": 10,
  "tiempo_promedio_respuesta_seg": 24,
  "por_area": [{"nombre": "Habitación 1", "total_llamados": 12}],
  "por_tipo": [{"tipo": "Normal", "total_llamados": 9}, {"tipo": "Emergencia", "total_llamados": 3}],
  "por_dia": [{"fecha": "2026-09-29", "promedio": 24}]
}
```

Los grupos también admiten cantidad o total. Si falta por_dia, se obtiene el historial paginado y se calcula el promedio de llamados atendidos por día de activación. Las fechas abarcan el día local completo y se envían como fecha_desde/fecha_hasta ISO; otros filtros: area_id y origen. Los mismos filtros se aplican a PDF/CSV.

## Plano e imágenes

Agregar a src/assets/: recepcion.png, secretaria.png, sala_espera.png, enfermeria.png, pasillo.png, quirofano.png, bano.png, habitacion1.png y habitacion2.png. **Estos nueve archivos no estaban presentes.** Mientras falten se utilizan imágenes SVG esquemáticas generadas por código. Al agregar PNG, reconstruir el proyecto.

Las áreas y camas usan coordenadas porcentuales globales de un canvas 1920×1080. El plano mantiene relación 16:9. PLANO_REFERENCIA contiene las doce distribuciones del pedido, sin crear registros ni presentar datos ficticios.

## Sesión y eventos

El token se guarda en localStorage bajo codigoAzul.token. GET /api/auth/me valida la sesión; un 401 autenticado la cierra. El login muestra su propio error 401. Los cambios de sesión se sincronizan entre pestañas.

El socket autentica con token y emite join/hospital. Escucha nuevoLlamado, llamadoAtendido, codigoAzul y logSistema. Al conectar o reconectar obtiene los llamados activos y reconcilia eventos recibidos durante la consulta. La consola conserva los últimos 500 eventos. Las desconexiones marcan el estado como no sincronizado. El overlay dura tres segundos y respeta movimiento reducido.

## Vercel

1. Importar el repositorio. **Root Directory: frontend**, preset **Vite**.
2. Build Command: npm run build. Output Directory: dist.
3. En **Environment Variables**, configurar **VITE_API_URL** y **VITE_SOCKET_URL** con el origen HTTPS del backend.
4. Autorizar el dominio de Vercel en FRONTEND_URL/CORS del backend.
5. Desplegar. vercel.json habilita acceso directo a rutas como /dashboard.

Las variables VITE_* son públicas y se incorporan al build. No colocar secretos del servidor.

## Dependencias

Se conserva Router v6 por requisito explícito. npm audit informa dos entradas moderadas para react-router/react-router-dom y propone actualizar a v7. La SPA usa rutas constantes y no utiliza hidratación SSR. Una actualización mayor requiere revisar el requisito de versión.

Referencias: [rutas de React Router v6](https://reactrouter.com/6.30.1/components/routes), [deploy de Vite en Vercel](https://vite.dev/guide/static-deploy.html#vercel).
~~~~
