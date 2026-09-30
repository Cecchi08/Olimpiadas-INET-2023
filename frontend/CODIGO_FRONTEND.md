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
import Enfermeros from './pages/Enfermeros';
import Camas from './pages/Camas';
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
      <Route path="/enfermeros" element={<ProtectedRoute requiredRole="Administrador"><Enfermeros /></ProtectedRoute>} />
      <Route path="/camas" element={<ProtectedRoute requiredRole="Administrador"><Camas /></ProtectedRoute>} />
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

const resourceAPI = path => ({
  getAll: (params = {}, signal) => api.get(path, { params, signal }),
  getById: (id, signal) => api.get(`${path}/${encodeURIComponent(id)}`, { signal }),
  create: values => api.post(path, values),
  update: (id, values) => api.put(`${path}/${encodeURIComponent(id)}`, values),
  delete: id => api.delete(`${path}/${encodeURIComponent(id)}`),
});

export const pacientesAPI = resourceAPI('/api/pacientes');
export const usuariosAPI = {
  getAll: (params = {}, signal) => api.get('/api/auth/usuarios', { params, signal }),
  register: values => api.post('/api/auth/register', values),
  updateRol: (id, rol) => api.put(`/api/auth/usuarios/${encodeURIComponent(id)}/rol`, { rol }),
  update: (id, values) => api.put(`/api/auth/usuarios/${encodeURIComponent(id)}`, values),
  delete: id => api.delete(`/api/auth/usuarios/${encodeURIComponent(id)}`),
};
export const enfermerosAPI = {
  getAll: (params = {}, signal) => api.get('/api/enfermeros', { params, signal }),
};
export const areasAPI = resourceAPI('/api/areas');
export const camasAPI = resourceAPI('/api/camas');
export const llamadosAPI = {
  crear: values => api.post('/api/llamados/crear', values),
  atender: id => api.put(`/api/llamados/${encodeURIComponent(id)}/atender`, {}),
  getActivos: (params = {}, signal) => api.get('/api/llamados/activos', { params, signal }),
  getAll: (params = {}, signal) => api.get('/api/llamados', { params, signal }),
};
export const reportesAPI = {
  getEstadisticas: (params = {}, signal) => api.get('/api/reportes/estadisticas', { params, signal }),
  exportPDF: (params = {}) => api.get('/api/reportes/export/pdf', { params, responseType: 'blob' }),
  exportCSV: (params = {}) => api.get('/api/reportes/export/csv', { params, responseType: 'blob' }),
};
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { crearSocket } from '../services/socket';
import { llamadosAPI, listarTodos, mensajeError } from '../services/api';
import { sonarAlarma } from '../utils/alarma';
import { SocketContext } from './contexts';

const normalize = row => ({ ...row, id: row.id ?? row.llamado_id });
export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [ultimoLlamado, setUltimoLlamado] = useState(null);
  const [alertaAzul, setAlertaAzul] = useState(null);
  const [activos, setActivos] = useState([]);
  const [sincronizado, setSincronizado] = useState(false);
  const [fases, setFases] = useState({});
  const controls = useRef({});
  const timers = useRef(new Map());
  const seen = useRef(new Set());
  const attended = useRef(new Set());
  const arrived = useRef(new Set());
  const log = useCallback((tipo, mensaje, timestamp = new Date()) => setLogs(previous => [...previous.slice(-499), {
    id: crypto.randomUUID(), timestamp, tipo, mensaje
  }]), []);
  const limpiarLogs = useCallback(() => setLogs([]), []);
  const cancel = useCallback(id => {
    for (const timer of timers.current.get(String(id)) || []) clearTimeout(timer);
    timers.current.delete(String(id));
  }, []);
  const phase = useCallback((id, value) => setFases(previous => ({ ...previous, [id]: value })), []);
  const registrarLlegada = useCallback(row => {
    const id = String(row.id);
    if (attended.current.has(id) || arrived.current.has(id)) return;
    arrived.current.add(id); phase(id, 'llego');
    log('info', `🏃 ${row.enfermero_destino?.nombre || row.enfermero_destino?.email || 'Personal de enfermería'} llegó a ${row.area?.nombre || 'el área'}`);
  }, [log, phase]);
  const animate = useCallback((row, restore = false) => {
    const id = String(row.id);
    if (seen.current.has(id) || attended.current.has(id)) return;
    seen.current.add(id);
    const start = Date.parse(row.timestamp || row.fecha_hora_activacion || row.fecha_activacion);
    const age = restore && Number.isFinite(start) ? Math.max(0, Date.now() - start) : 0;
    function after(ms, action) {
      if (restore && age >= ms) return;
      const timer = setTimeout(action, Math.max(0, ms - age));
      timers.current.set(id, [...(timers.current.get(id) || []), timer]);
    }
    phase(id, age >= 4000 ? 'llego' : age >= 1000 ? 'viaje' : age >= 350 ? 'alarma' : 'activado');
    if (!restore) log('warning', `🔵 ${row.paciente?.nombre || 'Paciente'} activó ${row.tipo === 'Emergencia' ? 'Código Azul' : 'un llamado'} en ${row.area?.nombre || 'el área'} (${row.origen})`);
    after(350, () => { phase(id, 'alarma'); sonarAlarma(); log('warning', `🔊 Alarma sonando en ${row.area?.nombre || 'el área'} y Recepción`); });
    after(700, () => log('info', `💾 Llamado guardado en BD (ID: ${row.id})`));
    after(850, () => { if (row.tipo === 'Emergencia') setAlertaAzul({ ...row, eventId: crypto.randomUUID() }); });
    after(1000, () => phase(id, 'viaje'));
    // Los llamados operativos sin avatar conservan una acción de atención.
    if (!row.enfermero_destino_id && !row.enfermero_destino) after(4000, () => phase(id, 'llego'));
  }, [log, phase]);
  const receiveNew = useCallback(raw => {
    const data = normalize(raw);
    if (attended.current.has(String(data.id))) return;
    controls.current.change?.({ kind: 'add', data });
    setActivos(previous => [...previous.filter(row => String(row.id) !== String(data.id)), data]);
    setUltimoLlamado(data); animate(data);
  }, [animate]);
  const receiveAttended = useCallback(raw => {
    const data = normalize(raw); const id = String(data.id);
    controls.current.change?.({ kind: 'remove', data });
    setActivos(previous => previous.filter(row => String(row.id) !== id));
    cancel(id); phase(id, 'atendido');
    if (attended.current.has(id)) return;
    attended.current.add(id);
    log('info', `✅ ${data.enfermero?.nombre || data.enfermero?.email || 'Enfermero'} atendió el llamado. Tiempo: ${data.tiempo_respuesta_segundos ?? data.tiempo_respuesta_seg ?? '—'}s${data.atencion_automatica ? ' · Atención automática del demo' : ''}`);
  }, [cancel, log, phase]);
  const atenderLlamado = useCallback(async id => {
    try {
      const { data } = await llamadosAPI.atender(id);
      receiveAttended({ ...data, id }); return data;
    } catch (error) {
      if (error.response?.status === 409) {
        controls.current.sync?.();
        log('info', 'El llamado ya fue atendido. Actualizando el tablero.');
        return;
      }
      throw error;
    }
  }, [log, receiveAttended]);
  useEffect(() => {
    if (!token) return;
    const socket = crearSocket(token);
    const scheduled = timers.current;
    const known = seen.current;
    let alive = true; let generation = 0; let changes = []; let syncing = false; let controller;
    const merge = (rows, event) => event.kind === 'remove'
      ? rows.filter(row => String(row.id) !== String(event.data.id))
      : [...rows.filter(row => String(row.id) !== String(event.data.id)), event.data];
    async function sync() {
      const current = ++generation;
      changes = []; syncing = true; controller?.abort(); controller = new AbortController();
      setConectado(socket.connected); setSincronizado(false);
      log('info', 'Conexión establecida. Sincronizando llamados activos…');
      try {
        const rows = await listarTodos('/api/llamados/activos', {}, controller.signal);
        if (!alive || current !== generation) return;
        const merged = changes.reduce(merge, rows.map(normalize));
        setActivos(merged); setSincronizado(true); syncing = false; changes = [];
        const ids = new Set(merged.map(row => String(row.id)));
        for (const id of timers.current.keys()) if (!ids.has(id)) cancel(id);
        for (const row of merged) animate(row, true);
        log('info', 'Llamados activos sincronizados.');
      } catch (error) {
        if (alive && current === generation && error.code !== 'ERR_CANCELED') {
          syncing = false; changes = []; log('danger', mensajeError(error));
        }
      }
    }
    controls.current = { sync, change: event => { if (syncing) changes.push(event); } };
    socket.on('connect', sync);
    socket.on('disconnect', () => { generation++; controller?.abort(); setConectado(false); setSincronizado(false); log('warning', 'Conexión interrumpida. Los datos pueden estar desactualizados.'); });
    socket.on('connect_error', error => { setConectado(false); log('danger', `No se pudo conectar: ${error.message}`); });
    socket.on('nuevoLlamado', receiveNew);
    socket.on('llamadoAtendido', receiveAttended);
    socket.on('codigoAzul', data => receiveNew({ ...data, tipo: 'Emergencia' }));
    socket.on('notificacionEnfermero', data => log('warning', `📟 ${data.mensaje}`));
    socket.on('logSistema', data => {
      const message = typeof data === 'string' ? data : data?.mensaje || 'Evento del sistema';
      if (!/^(🔵 |💾 Llamado registrado|✅ Llamado #)/u.test(message)) {
        log(['info', 'warning', 'danger'].includes(data?.tipo) ? data.tipo : 'info', message, data?.timestamp);
      }
    });
    // Respaldo de HTTP cuando se pierde un evento o la conexión de sockets.
    const poll = setInterval(sync, 10000);
    return () => {
      alive = false; controller?.abort(); clearInterval(poll); socket.removeAllListeners(); socket.disconnect();
      for (const id of scheduled.keys()) cancel(id);
      known.clear(); controls.current = {};
    };
  }, [token, animate, cancel, log, receiveNew, receiveAttended]);
  const llamadoActivo = activos[0] || null;
  const marcarAtendido = useCallback(id => {
    const target = id ?? activos[0]?.id;
    return target == null ? Promise.resolve() : atenderLlamado(target);
  }, [activos, atenderLlamado]);
  return <SocketContext.Provider value={{ logs, conectado, ultimoLlamado, alertaAzul, activos, sincronizado,
    llamadoActivo, limpiarLogs, marcarAtendido, registrarLlegada,
    fases, registrarLlamado: receiveNew, atenderLlamado }}>{children}</SocketContext.Provider>;
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
  const links = [['dashboard', 'Dashboard'], ['pacientes', 'Pacientes'], ...(rol === 'Administrador' ? [['areas', 'Áreas'], ['camas', 'Camas'], ['enfermeros', 'Enfermeros'], ['usuarios', 'Usuarios']] : []), ['reportes', 'Reportes']];
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
    {alerta && <motion.span className={styles.pulse} animate={reduce ? {} : { scale: [1, 1.5, 1], opacity: [.8, .3, .8] }} transition={{ duration: 1, repeat: Infinity }} />}
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
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useRecursos } from '../hooks/useRecursos';
import { useSocket } from '../hooks/useSocket';
import { normalizarArea } from '../utils/constantes';
import { habilitarAudio } from '../utils/alarma';
import { llamadosAPI, mensajeError } from '../services/api';
import AreaMapa from './AreaMapa';
import Avatar from './Avatar';
import Icon from './Icon';
import BotonCodigoAzul from './BotonCodigoAzul';
import ModalSimulacion from './ModalSimulacion';
import BotonAtender from './BotonAtender';
import EnfermeroAvatar from './EnfermeroAvatar';
import Feedback from './Feedback';
import styles from './MapaHospital.module.css';
import ui from '../styles/ui.module.css';

const point = row => ({ x: Number(row?.coordenadas_x ?? row?.coord_x ?? 50), y: Number(row?.coordenadas_y ?? row?.coord_y ?? 17) });
export default function MapaHospital() {
  const { data, loading, error, reload } = useRecursos(['/api/areas', '/api/camas', '/api/pacientes', '/api/enfermeros']);
  const { activos, alertaAzul, fases, registrarLlamado, registrarLlegada } = useSocket();
  const [visibleAlert, setVisibleAlert] = useState(null);
  const [modal, setModal] = useState(null);
  const [success, setSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [pending, setPending] = useState(null);
  const reduce = useReducedMotion();
  const areas = useMemo(() => (data['/api/areas'] || []).map(normalizarArea), [data]);
  const camas = data['/api/camas'] || [];
  const pacientes = data['/api/pacientes'] || [];
  const enfermeros = useMemo(() => [...new Map([
    ...(data['/api/enfermeros'] || []), ...activos.map(row => row.enfermero_destino).filter(Boolean)
  ].map(row => [row.id, row])).values()], [data, activos]);
  useEffect(() => {
    if (!alertaAzul) return;
    const show = setTimeout(() => setVisibleAlert(alertaAzul), 0);
    const hide = setTimeout(() => setVisibleAlert(null), 3000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [alertaAzul]);
  const geometryValid = area => [area.coordenadas_x, area.coordenadas_y, area.ancho, area.alto].every(value => value != null && Number.isFinite(Number(value)));
  const target = call => point(call.origen === 'Cama'
    ? call.cama || camas.find(row => String(row.id) === String(pacientes.find(p => String(p.id) === String(call.paciente_id))?.cama_id)) || call.area
    : call.area || areas.find(row => String(row.id) === String(call.area_id)));
  async function activarCama(patient) {
    habilitarAudio(); setPending(patient.id); setActionError(''); setSuccess('');
    try {
      const { data: called } = await llamadosAPI.crear({
        paciente_id: patient.id, area_id: patient.area_id, origen: 'Cama', tipo: 'Emergencia', simulacion: true
      });
      registrarLlamado(called); setSuccess('Código Azul activado desde la cama.');
    } catch (failure) { setActionError(mensajeError(failure)); }
    finally { setPending(null); }
  }
  return <section className={styles.panel}>
    <header className={styles.header}><div><span className={styles.icon}><Icon name="areas" size={18} /></span><h2>Mapa del hospital<small>Distribución de áreas y pacientes</small></h2></div><button className={ui.secondary} onClick={reload} disabled={loading} aria-label="Actualizar mapa">↻ Actualizar</button></header>
    <Feedback error={error || actionError} success={success} />
    <div className={styles.viewport}><div className={styles.map} aria-label="Plano del hospital, coordenadas sobre un canvas de 1920 por 1080">
      {loading && <p className={styles.state} role="status"><span className={ui.spinner} />Cargando plano del hospital…</p>}
      {!loading && !areas.length && <p className={styles.state}>{error ? 'Plano no disponible' : 'Todavía no hay áreas registradas.'}</p>}
      {areas.filter(geometryValid).map(area => <AreaMapa key={area.id} area={area} />)}
      {areas.filter(area => activos.some(call => String(call.area_id) === String(area.id) && fases[call.id] && fases[call.id] !== 'activado')).map(area =>
        <motion.div key={`alarm-${area.id}`} className={styles.areaAlarm} aria-label={`Alarma en ${area.nombre}`}
          style={{ left: `${area.coordenadas_x}%`, top: `${area.coordenadas_y}%`, width: `${area.ancho}%`, height: `${area.alto}%` }}
          initial={{ opacity: 0 }} animate={{ opacity: .4 }} />)}
      {camas.map(cama => {
        const { x, y } = point(cama);
        const patient = pacientes.find(item => String(item.cama_id) === String(cama.id));
        const call = patient && activos.find(row => String(row.paciente_id) === String(patient.id));
        return <div key={cama.id}>
          <Avatar tipo={patient ? 'paciente' : 'cama'} nombre={patient?.nombre || cama.nombre} coordenadas_x={x} coordenadas_y={y} alerta={Boolean(call)} />
          {patient && <button className={styles.quick} style={{ left: `${x + 2}%`, top: `${y - 2}%` }} disabled={Boolean(call) || pending !== null} aria-busy={pending === patient.id}
            title={`Simular alarma para ${patient.nombre}`} aria-label={`Simular alarma para ${patient.nombre}`}
            onClick={() => activarCama(patient)}>🚨</button>}
        </div>;
      })}
      {enfermeros.map(enfermero => {
        const call = activos.find(row => row.enfermero_destino_id === enfermero.id || row.enfermero_destino?.id === enfermero.id);
        const base = point(areas.find(row => row.id === enfermero.area_asignada_id) || areas.find(row => row.tipo === 'Enfermeria'));
        const moving = call && fases[call.id] === 'viaje';
        const atPatient = call && ['viaje', 'llego'].includes(fases[call.id]);
        return <EnfermeroAvatar key={enfermero.id} enfermero={enfermero} inicio={base} destino={atPatient ? target(call) : null}
          moviendo={Boolean(moving)} onLlegada={() => { if (moving) registrarLlegada(call); }} />;
      })}
      {activos.filter(call => fases[call.id] === 'llego').map(call => <BotonAtender key={call.id} llamado={call} {...target(call)} />)}
      <BotonCodigoAzul disabled={loading || Boolean(error)} onClick={() => setModal({})} />
    </div></div>
    <footer className={styles.legend}><div><span><i className={styles.patient} />Paciente</span><span><i className={styles.nurse} />Enfermero asignado</span><span><i className={styles.call} />Llamado activo</span><span><i className={styles.bed} />Cama libre</span></div><small>Vista de planta · 1920 × 1080</small></footer>
    {areas.some(area => !geometryValid(area)) && <p className={ui.notice}>Hay áreas sin coordenadas válidas que no pueden ubicarse en el plano.</p>}
    {modal && <ModalSimulacion pacientes={pacientes} areas={areas} initialPatient={modal.patient} onClose={() => setModal(null)} onSuccess={setSuccess} />}
    {visibleAlert && createPortal(<motion.div key={visibleAlert.eventId} className={styles.fullAlert} role="alert"
      initial={{ opacity: .2 }} animate={{ opacity: reduce ? .25 : [.2, .5, .2] }} transition={{ duration: 1, repeat: 2 }}>
      <strong>CÓDIGO AZUL · {visibleAlert.area?.nombre || 'Emergencia'}</strong>
    </motion.div>, document.body)}
  </section>;
}
~~~~

## src/components/MapaHospital.module.css

~~~~css
.panel { min-width: 0; display: flex; flex-direction: column; background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }.header { padding: 19px 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #edf1f5; }.header > div { display: flex; align-items: center; gap: 10px; }.header h2 { font-size: 14px; margin: 0; font-weight: 600; }.header small { display: block; color: #94a3b8; font-size: 10px; font-weight: 400; margin-top: 5px; }.header button { font-size: 10px; padding: 7px 9px; }.icon { width: 34px; height: 34px; border-radius: 8px; background: #eff6ff; color: #3b82f6; display: grid; place-items: center; }.viewport { padding: 12px; flex: 1; display: flex; align-items: center; }.map { position: relative; width: 100%; aspect-ratio: 16 / 9; background-color: white; background-image: linear-gradient(#e9eef680 1px, transparent 1px), linear-gradient(90deg, #e9eef680 1px, transparent 1px); background-size: 18px 18px; border-radius: 5px; overflow: hidden; }.state { position: absolute; inset: 0; display: grid; place-items: center; color: #94a3b8; font-size: 13px; text-align: center; }.legend { padding: 14px 20px; border-top: 1px solid #edf1f5; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }.legend > div { display: flex; gap: 14px; flex-wrap: wrap; }.legend span { display: flex; align-items: center; gap: 5px; font-size: 9px; color: #64748b; }.legend i { width: 6px; height: 6px; border-radius: 50%; }.legend small { color: #94a3b8; font-size: 9px; }.patient { background: #10b981; }.nurse { background: #3b82f6; }.call { background: #ef4444; }.bed { background: #94a3b8; }.alert { position: absolute; inset: 0; background: #ef4444; z-index: 8; pointer-events: none; display: grid; place-items: center; }.alert strong { color: white; font-size: clamp(14px, 2vw, 28px); }

.areaAlarm { position: absolute; transform: translate(-50%,-50%); background: #2563eb; border-radius: 8px; z-index: 2; pointer-events: none; }
.quick { position: absolute; z-index: 7; border: 1px solid #fecaca; background: white; border-radius: 50%; width: 24px; height: 24px; padding: 0; font-size: 13px; transform: translate(-50%,-50%); }
.quick:disabled { opacity: .4; }
.fullAlert { position: fixed; inset: 0; z-index: 9999; pointer-events: none; display: grid; place-items: center; background: #ef4444; }
.fullAlert strong { color: white; background: #b91c1c; padding: 14px 22px; border-radius: 10px; font-size: clamp(18px,3vw,38px); text-align: center; }
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
import { mensajeError } from '../services/api';
import MapaHospital from '../components/MapaHospital';
import Consola from '../components/Consola';
import Icon from '../components/Icon';
import { formatearHora } from '../utils/formateoFechas';
import styles from './Dashboard.module.css';
import ui from '../styles/ui.module.css';
export default function Dashboard() {
  const { activos, conectado, sincronizado, atenderLlamado } = useSocket();
  const { data, loading, error } = useRecursos(['/api/pacientes', '/api/camas']);
  const [pending, setPending] = useState(null);
  const [actionError, setActionError] = useState('');
  const [atendidos, setAtendidos] = useState([]);
  async function atender(id) {
    setPending(id); setActionError('');
    try { await atenderLlamado(id); setAtendidos(previous => [...previous, id]); }
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
import { useRecursos } from '../hooks/useRecursos';
import { useCrud } from '../hooks/useCrud';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import Feedback from '../components/Feedback';
import styles from './Pacientes.module.css';
import ui from '../styles/ui.module.css';
const textMedical = value => typeof value === 'object' && value !== null ? JSON.stringify(value) : value || '';
function PacienteForm({ crud, areas, camas, pacientes, nurses }) {
  const patient = crud.editing;
  const [areaId, setAreaId] = useState(String(patient.area_id || ''));
  const [camaId, setCamaId] = useState(String(patient.cama_id || ''));
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
    <label className={ui.field}>Enfermero asignado<select aria-label="Enfermero asignado" name="enfermero_asignado_id" defaultValue={patient.enfermero_asignado_id || patient.enfermero_id || ''} disabled={crud.busy}><option value="">Sin asignar</option>{nurses.map(nurse => <option key={nurse.id} value={nurse.id}>{nurse.nombre || nurse.email}{nurse.area ? ` · ${nurse.area.nombre}` : ''}</option>)}</select></label>
    {crud.error && <p className={ui.error} role="alert">{crud.error}</p>}
    <div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button><button className={ui.primary} disabled={crud.busy}>{crud.busy ? 'Guardando…' : 'Guardar paciente'}</button></div>
  </form>;
}
export default function Pacientes() {
  const { data, loading, error, reload } = useRecursos(['/api/pacientes', '/api/areas', '/api/camas', '/api/enfermeros']);
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
  return <div className={styles.page}><div className={ui.header}><div><p className={ui.eyebrow}>GESTIÓN HOSPITALARIA</p><h1 className={ui.title}>Pacientes</h1><p className={ui.subtitle}>Información y asignaciones para una atención coordinada.</p></div><button className={ui.primary} disabled={loading || Boolean(error)} onClick={() => crud.edit()}>＋ Nuevo Paciente</button></div>
    <div className={styles.toolbar}><input className={ui.search} aria-label="Buscar pacientes" placeholder="Buscar por nombre o DNI…" value={search} onChange={event => setSearch(event.target.value)} /><span>{pacientes.length} pacientes</span><button className={ui.secondary} onClick={reload} disabled={loading}>Actualizar</button></div>
    <Feedback error={error} success={crud.success} loading={loading} />
    <TablaGenerica columns={columns} rows={pacientes.filter(row => `${row.nombre} ${row.dni}`.toLowerCase().includes(search.toLowerCase()))} loading={loading} actions={row => <><button className={ui.secondary} onClick={() => crud.edit(row)}>Editar</button><button className={ui.danger} onClick={() => crud.remove(row)}>Eliminar</button></>} />
    {crud.editing && <Modal title={crud.editing.id ? 'Editar paciente' : 'Nuevo paciente'} onClose={crud.close}><PacienteForm crud={crud} areas={areas} camas={camas} pacientes={pacientes} nurses={data['/api/enfermeros'] || []} /></Modal>}
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
import Feedback from '../components/Feedback';
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
    <Feedback success={crud.success} loading={loading} />
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
﻿import PersonalPage from '../components/PersonalPage';
export default function Usuarios() { return <PersonalPage />; }
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

## src/components/BotonAtender.jsx

~~~~jsx
import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { mensajeError } from '../services/api';
import styles from './BotonAtender.module.css';
export default function BotonAtender({ llamado, x, y }) {
  const { atenderLlamado } = useSocket();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function attend() {
    setBusy(true); setError('');
    try { await atenderLlamado(llamado.id); }
    catch (failure) { setError(mensajeError(failure)); }
    finally { setBusy(false); }
  }
  return <div className={styles.anchor} style={{ left: `${Math.min(80, Math.max(20, x))}%`, top: `${Math.max(8, y - 6)}%` }}>
    <button className={styles.button} disabled={busy} aria-busy={busy} onClick={attend} aria-label={`Atender llamado ${llamado.id}`}>{busy ? 'Atendiendo…' : '✅ ATENDER LLAMADO'}</button>
    {error && <p className={styles.error} role="alert">{error}</p>}
  </div>;
}
~~~~

## src/components/BotonAtender.module.css

~~~~css
.anchor { position: absolute; transform: translate(-50%, -100%); z-index: 12; }.button { white-space: nowrap; padding: 7px 9px; background: #15803d; color: white; font-size: clamp(8px,.75vw,11px); border: 1px solid white; border-radius: 6px; box-shadow: 0 2px 8px #0003; }.error { background: #fef2f2; color: #b91c1c; padding: 8px; min-width: 150px; font-size: 11px; }
~~~~

## src/components/BotonCodigoAzul.jsx

~~~~jsx
import { motion, useReducedMotion } from 'framer-motion';
import { habilitarAudio } from '../utils/alarma';
import styles from './BotonCodigoAzul.module.css';
export default function BotonCodigoAzul({ onClick, disabled }) {
  const reduce = useReducedMotion();
  return <motion.button className={styles.button} disabled={disabled}
    animate={reduce || disabled ? {} : { boxShadow: ['0 0 0 0 #2563eb66', '0 0 0 10px #2563eb00'] }}
    transition={{ duration: 1.5, repeat: Infinity }} onClick={() => { habilitarAudio(); onClick(); }}>
    🚨 SIMULAR CÓDIGO AZUL
  </motion.button>;
}
~~~~

## src/components/BotonCodigoAzul.module.css

~~~~css
.button { position: absolute; bottom: 10px; right: 10px; z-index: 10; border: 0; background: #174bb5; color: white; padding: 12px 16px; border-radius: 10px; font-weight: 700; font-size: clamp(9px, .9vw, 13px); box-shadow: 0 3px 12px #174bb555; }
@media(max-width: 600px) { .button { padding: 8px; bottom: 5px; right: 5px; } }
~~~~

## src/components/ConfirmarEliminar.jsx

~~~~jsx
import Modal from './Modal';
import ui from '../styles/ui.module.css';
export default function ConfirmarEliminar({ crud }) {
  if (!crud.deleting) return null;
  return <Modal title="Eliminar registro" onClose={crud.close}><p className={ui.subtitle}>Se eliminará «{crud.deleting.nombre || crud.deleting.email}». Esta acción no se puede deshacer.</p>{crud.error && <p className={ui.error} role="alert">{crud.error}</p>}<div className={ui.formFooter}><button className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button><button className={ui.danger} aria-busy={crud.busy} disabled={crud.busy} onClick={crud.confirmDelete}>{crud.busy ? 'Eliminando…' : 'Eliminar'}</button></div></Modal>;
}
~~~~

## src/components/EnfermeroAvatar.jsx

~~~~jsx
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import styles from './EnfermeroAvatar.module.css';
export default function EnfermeroAvatar({ enfermero, inicio, destino, moviendo = false, onLlegada }) {
  const reduce = useReducedMotion();
  const [animando, setAnimando] = useState(false);
  const target = destino || inicio;
  return <motion.div className={styles.avatar} title={enfermero.nombre || enfermero.email}
    aria-label={`${enfermero.nombre || enfermero.email} · ${moviendo ? 'Caminando' : 'Enfermero'}`}
    initial={{ left: `${inicio.x}%`, top: `${inicio.y}%` }}
    animate={{ left: `${target.x}%`, top: `${target.y}%` }}
    transition={{ duration: reduce ? 0 : 3, ease: 'easeInOut' }} onAnimationStart={() => setAnimando(true)}
    onAnimationComplete={() => { setAnimando(false); onLlegada?.(); }}>
    <span aria-hidden="true" data-moviendo={moviendo || animando}>E</span><small>{enfermero.nombre || enfermero.email}</small>
  </motion.div>;
}
~~~~

## src/components/EnfermeroAvatar.module.css

~~~~css
.avatar { position: absolute; transform: translate(-50%,-50%); z-index: 6; pointer-events: none; display: grid; justify-items: center; }.avatar span { width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; background: #2563eb; display: grid; place-items: center; box-shadow: 0 2px 7px #0003; }.avatar small { background: #ffffffed; color: #174bb5; border-radius: 4px; padding: 2px 4px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: clamp(6px,.65vw,10px); }
.avatar span { color: white; font-weight: 700; }
~~~~

## src/components/Feedback.jsx

~~~~jsx
import ui from '../styles/ui.module.css';
import Toast from './Toast';
export default function Feedback({ loading, error, success }) {
  return <>{loading && <p className={ui.loading} role="status"><span className={ui.spinner} />Cargando…</p>}
    {error && <Toast key={`error:${error}`} tipo="error" mensaje={error} />}
    {success && <Toast key={`success:${success}`} mensaje={success} />}</>;
}
~~~~

## src/components/Icon.jsx

~~~~jsx
const paths = {
  camas: 'M3 18V6 M3 12h18v6 M3 15h18 M7 12V8h5v4 M21 18v2 M3 18v2',
  enfermeros: 'M12 3v8 M8 7h8 M4 21v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3',
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

## src/components/ModalSimulacion.jsx

~~~~jsx
import { useState } from 'react';
import Modal from './Modal';
import Feedback from './Feedback';
import { useSocket } from '../hooks/useSocket';
import { llamadosAPI, mensajeError } from '../services/api';
import { habilitarAudio } from '../utils/alarma';
import styles from './ModalSimulacion.module.css';
import ui from '../styles/ui.module.css';
export default function ModalSimulacion({ pacientes, areas, initialPatient = '', onClose, onSuccess }) {
  const [pacienteId, setPacienteId] = useState(String(initialPatient));
  const [origen, setOrigen] = useState('Cama');
  const [tipo, setTipo] = useState('Emergencia');
  const [banoId, setBanoId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { registrarLlamado } = useSocket();
  const patient = pacientes.find(row => String(row.id) === pacienteId);
  const invalidBed = origen === 'Cama' && patient && !patient.cama_id;
  async function submit(event) {
    event.preventDefault(); habilitarAudio(); setBusy(true); setError('');
    try {
      const { data } = await llamadosAPI.crear({
        paciente_id: Number(pacienteId), origen, tipo, simulacion: true,
        area_id: origen === 'Baño' ? Number(banoId) : patient.area_id
      });
      registrarLlamado(data); onSuccess?.('Simulación activada. Se atenderá automáticamente a los 30 segundos si sigue pendiente.'); onClose();
    } catch (failure) { setError(mensajeError(failure)); }
    finally { setBusy(false); }
  }
  return <Modal title="Simular Código Azul" onClose={() => { if (!busy) onClose(); }}>
    <form className={`${ui.form} ${styles.form}`} onSubmit={submit}>
      <p className={styles.note}>Modo demostración · atención automática a los 30 segundos.</p>
      <label className={ui.field}>Paciente<select aria-label="Paciente" value={pacienteId} onChange={event => setPacienteId(event.target.value)} required disabled={busy}><option value="">Seleccionar paciente</option>{pacientes.map(row => <option key={row.id} value={row.id}>{row.nombre} · DNI {row.dni}</option>)}</select></label>
      <div className={ui.row}><label className={ui.field}>Origen<select aria-label="Origen" value={origen} onChange={event => setOrigen(event.target.value)} disabled={busy}><option>Cama</option><option>Baño</option></select></label>
        <label className={ui.field}>Tipo<select aria-label="Tipo" value={tipo} onChange={event => setTipo(event.target.value)} disabled={busy}><option>Emergencia</option><option>Normal</option></select></label></div>
      {origen === 'Baño' && <label className={ui.field}>Baño de origen<select aria-label="Baño de origen" value={banoId} onChange={event => setBanoId(event.target.value)} required disabled={busy}><option value="">Seleccionar baño</option>{areas.filter(area => area.tipo === 'Bano').map(area => <option key={area.id} value={area.id}>{area.nombre}</option>)}</select></label>}
      {invalidBed && <p className={ui.error} role="alert">El paciente no tiene cama asignada. Asignale una cama o seleccioná Baño.</p>}
      {!pacientes.length && <p className={ui.notice}>Primero registrá un paciente en la página Pacientes.</p>}
      <Feedback error={error} />
      <div className={ui.formFooter}><button type="button" className={ui.secondary} onClick={onClose} disabled={busy}>Cancelar</button><button className={ui.primary} disabled={busy || !pacientes.length || invalidBed} aria-busy={busy}>{busy ? 'Activando…' : 'ACTIVAR ALARMA'}</button></div>
    </form>
  </Modal>;
}
~~~~

## src/components/ModalSimulacion.module.css

~~~~css
.form { min-width: 0; }.note { padding: 10px 14px; color: #174bb5; background: #eff6ff; border-radius: 8px; font-size: 13px; }
~~~~

## src/components/PersonalPage.jsx

~~~~jsx
import { useRecursos } from '../hooks/useRecursos';
import { useCrud } from '../hooks/useCrud';
import { ROLES } from '../utils/constantes';
import TablaGenerica from './TablaGenerica';
import Modal from './Modal';
import ConfirmarEliminar from './ConfirmarEliminar';
import Feedback from './Feedback';
import styles from './PersonalPage.module.css';
import ui from '../styles/ui.module.css';

export default function PersonalPage({ enfermeros = false }) {
  const path = enfermeros ? '/api/enfermeros' : '/api/auth/usuarios';
  const { data, loading, error, reload } = useRecursos([path, '/api/areas']);
  const crud = useCrud('/api/auth/usuarios', reload, { createPath: '/api/auth/register',
    updatePath: id => `/api/auth/usuarios/${id}${enfermeros ? '' : '/rol'}` });
  const row = crud.editing;
  const title = enfermeros ? 'Enfermeros' : 'Usuarios';
  const columns = [
    ...(enfermeros ? [{ key: 'nombre', label: 'Nombre', render: value => value.nombre || value.email }] : []),
    { key: 'email', label: 'Email' },
    { key: 'rol', label: 'Rol' },
    ...(enfermeros ? [
      { key: 'area', label: 'Área asignada', render: value => value.area?.nombre || 'Sin asignar' },
      { key: 'turno', label: 'Turno', render: value => value.turno === 'Manana' ? 'Mañana' : value.turno || 'Sin asignar' },
      { key: 'pacientes_asignados', label: 'Pacientes asignados' }
    ] : [
      { key: 'created_at', label: 'Fecha de creación', render: value => value.created_at ? new Date(value.created_at).toLocaleDateString('es-AR') : '—' }
    ])
  ];
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (enfermeros) {
      values.rol = 'Generico';
      values.area_asignada_id = values.area_asignada_id ? Number(values.area_asignada_id) : null;
      values.turno = values.turno || null;
    }
    if (values.email) values.email = values.email.trim();
    await crud.save(values);
  }
  return <div className={styles.page}>
    <div className={ui.header}><div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>{title}</h1><p className={ui.subtitle}>Equipo hospitalario, accesos y asignaciones.</p></div>
      <button className={ui.primary} onClick={() => crud.edit()}>＋ {enfermeros ? 'Nuevo Enfermero' : 'Nuevo Usuario'}</button></div>
    <Feedback loading={loading} error={error} success={crud.success} />
    <TablaGenerica rows={data[path] || []} columns={columns} loading={loading} actions={value => <>
      <button className={ui.secondary} onClick={() => crud.edit(value)}>{enfermeros ? 'Editar' : 'Editar rol'}</button>
      <button className={ui.danger} onClick={() => crud.remove(value)}>Eliminar</button></>} />
    {row && <Modal title={row.id ? (enfermeros ? 'Editar enfermero' : 'Editar rol') : (enfermeros ? 'Nuevo enfermero' : 'Nuevo usuario')} onClose={crud.close}>
      <form className={ui.form} onSubmit={submit}>
        {enfermeros && <label className={ui.field}>Nombre<input name="nombre" defaultValue={row.nombre || ''} maxLength={160} required disabled={crud.busy} /></label>}
        {!row.id && <><label className={ui.field}>Email<input name="email" type="email" maxLength={254} required autoComplete="off" disabled={crud.busy} /></label>
          <label className={ui.field}>Contraseña<input aria-label="Contraseña" name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" disabled={crud.busy} /><small>Entre 12 y 128 caracteres.</small></label></>}
        {!enfermeros && <label className={ui.field}>Rol<select aria-label="Rol" name="rol" defaultValue={row.rol || 'Generico'} disabled={crud.busy}>{ROLES.map(rol => <option key={rol}>{rol}</option>)}</select></label>}
        {enfermeros && <div className={ui.row}>
          <label className={ui.field}>Área asignada<select aria-label="Área asignada" name="area_asignada_id" defaultValue={row.area_asignada_id || ''} required disabled={crud.busy}><option value="">Seleccionar área</option>{(data['/api/areas'] || []).map(area => <option key={area.id} value={area.id}>{area.nombre}</option>)}</select></label>
          <label className={ui.field}>Turno<select aria-label="Turno" name="turno" defaultValue={row.turno || 'Manana'} required disabled={crud.busy}><option value="Manana">Mañana</option><option>Tarde</option><option>Noche</option></select></label>
        </div>}
        <Feedback error={crud.error} />
        <div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button>
          <button className={ui.primary} disabled={crud.busy} aria-busy={crud.busy}>{crud.busy ? 'Guardando…' : row.id ? 'Guardar cambios' : enfermeros ? 'Crear enfermero' : 'Crear usuario'}</button></div>
      </form></Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
~~~~

## src/components/PersonalPage.module.css

~~~~css
.page { display: grid; gap: 16px; min-width: 0; }
~~~~

## src/components/Toast.jsx

~~~~jsx
import { useState } from 'react';
import styles from './Toast.module.css';

export default function Toast({ tipo = 'success', mensaje, onClose }) {
  const [dismissed, setDismissed] = useState(false);
  if (!mensaje || dismissed) return null;
  const error = tipo === 'error';
  return <div className={`${styles.toast} ${error ? styles.error : styles.success}`}
    role={error ? 'alert' : 'status'} aria-atomic="true">
    <span aria-hidden="true">{error ? '⚠' : '✓'}</span>
    <span className={styles.message}>{mensaje}</span>
    <button type="button" aria-label="Cerrar notificación" onClick={() => {
      setDismissed(true); onClose?.();
    }}>×</button>
  </div>;
}
~~~~

## src/components/Toast.module.css

~~~~css
.toast { display: flex; align-items: center; gap: 10px; padding: 12px 16px; margin: 12px 0; border: 1px solid; border-radius: 10px; font-size: 14px; }
.success { color: #166534; background: #f0fdf4; border-color: #86efac; }
.error { color: #991b1b; background: #fef2f2; border-color: #fca5a5; }
.message { flex: 1; overflow-wrap: anywhere; }
.toast button { border: 0; background: transparent; color: inherit; cursor: pointer; font-size: 22px; min-width: 32px; min-height: 32px; }
.toast button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 4px; }
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
export function useCrud(path, reload, { createPath = path, updatePath = id => `${path}/${id}` } = {}) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  function edit(row = {}) { setError(''); setSuccess(''); setEditing(row); }
  function remove(row) { setError(''); setSuccess(''); setDeleting(row); }
  function close() { if (!busy) { setEditing(null); setDeleting(null); setError(''); } }
  async function save(payload) {
    setBusy(true); setError('');
    try {
      if (editing.id != null) await api.put(updatePath(editing.id), payload);
      else await api.post(createPath, payload);
      setEditing(null); setSuccess('Registro guardado correctamente.'); reload(); return true;
    } catch (err) { setError(mensajeError(err)); return false; }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    setBusy(true); setError('');
    try { await api.delete(`${path}/${deleting.id}`); setDeleting(null); setSuccess('Registro eliminado correctamente.'); reload(); }
    catch (err) { setError(mensajeError(err)); }
    finally { setBusy(false); }
  }
  return { editing, deleting, busy, error, success, edit, remove, close, save, confirmDelete };
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

## src/pages/Camas.jsx

~~~~jsx
import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useRecursos } from '../hooks/useRecursos';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import Feedback from '../components/Feedback';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import styles from './Camas.module.css';
import ui from '../styles/ui.module.css';
export default function Camas() {
  const { data, loading, error, reload } = useRecursos(['/api/camas', '/api/areas']);
  const crud = useCrud('/api/camas', reload);
  const [area, setArea] = useState('');
  const areas = data['/api/areas'] || [];
  const rows = (data['/api/camas'] || []).filter(row => !area || String(row.area_id) === area);
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    await crud.save({ nombre: values.nombre.trim(), area_id: Number(values.area_id),
      coordenadas_x: Number(values.coordenadas_x), coordenadas_y: Number(values.coordenadas_y) });
  }
  return <div className={styles.page}>
    <div className={ui.header}><div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>Camas</h1><p className={ui.subtitle}>Ubicación y distribución por área.</p></div><button className={ui.primary} disabled={loading || Boolean(error)} onClick={() => crud.edit()}>＋ Nueva Cama</button></div>
    <label className={`${ui.field} ${styles.filter}`}>Filtrar por área<select aria-label="Filtrar por área" value={area} onChange={event => setArea(event.target.value)}><option value="">Todas las áreas</option>{areas.map(row => <option key={row.id} value={row.id}>{row.nombre}</option>)}</select></label>
    <Feedback loading={loading} error={error} success={crud.success} />
    <TablaGenerica rows={rows} loading={loading} columns={[
      { key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' },
      { key: 'area_id', label: 'Área', render: row => areas.find(area => area.id === row.area_id)?.nombre || row.area?.nombre || '—' },
      { key: 'coordenadas_x', label: 'X (%)' }, { key: 'coordenadas_y', label: 'Y (%)' }
    ]} actions={row => <><button className={ui.secondary} onClick={() => crud.edit(row)}>Editar</button><button className={ui.danger} onClick={() => crud.remove(row)}>Eliminar</button></>} />
    {crud.editing && <Modal title={crud.editing.id ? 'Editar cama' : 'Nueva cama'} onClose={crud.close}><form className={ui.form} onSubmit={submit}>
      <label className={ui.field}>Nombre<input name="nombre" defaultValue={crud.editing.nombre || ''} required maxLength={80} disabled={crud.busy} /></label>
      <label className={ui.field}>Área<select aria-label="Área" name="area_id" defaultValue={crud.editing.area_id || area || ''} required disabled={crud.busy}><option value="">Seleccionar área</option>{areas.map(row => <option key={row.id} value={row.id}>{row.nombre}</option>)}</select></label>
      <div className={ui.row}>{['x','y'].map(axis => <label className={ui.field} key={axis}>Coordenada {axis.toUpperCase()} (%)<input name={`coordenadas_${axis}`} type="number" min="0" max="100" step=".1" defaultValue={crud.editing[`coordenadas_${axis}`] ?? 50} required disabled={crud.busy} /></label>)}</div>
      <Feedback error={crud.error} /><div className={ui.formFooter}><button type="button" className={ui.secondary} onClick={crud.close} disabled={crud.busy}>Cancelar</button><button className={ui.primary} disabled={crud.busy} aria-busy={crud.busy}>{crud.busy ? 'Guardando…' : 'Guardar cama'}</button></div>
    </form></Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
~~~~

## src/pages/Camas.module.css

~~~~css
.page { min-width: 0; }.filter { max-width: 300px; margin-bottom: 18px; }
~~~~

## src/pages/Enfermeros.jsx

~~~~jsx
import PersonalPage from '../components/PersonalPage';
export default function Enfermeros() { return <PersonalPage enfermeros />; }
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
.success { color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 8px; font-size: 13px; }
.loading { color: #64748b; display: flex; align-items: center; gap: 8px; font-size: 13px; }
.spinner, button[aria-busy="true"]::before { content: ''; display: inline-block; width: 14px; height: 14px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }
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

## src/utils/alarma.js

~~~~javascript
let context;
export function habilitarAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  context ||= new Audio();
  context.resume().catch(() => {});
}
export function sonarAlarma() {
  if (!context || context.state !== 'running') return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain); gain.connect(context.destination);
  const start = context.currentTime;
  oscillator.frequency.setValueAtTime(740, start);
  oscillator.frequency.setValueAtTime(980, start + .2);
  gain.gain.setValueAtTime(.04, start);
  gain.gain.exponentialRampToValueAtTime(.001, start + .7);
  oscillator.start(); oscillator.stop(start + .75);
}
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
const automaticTimers = [];
test.afterEach(() => { for (const timer of automaticTimers.splice(0)) clearTimeout(timer); });
test.beforeAll(async () => {
  http = createServer();
  io = new Server(http, { cors: { origin: '*' } });
  await new Promise(resolve => http.listen(3099, '127.0.0.1', resolve));
});
test.afterAll(async () => { await new Promise(resolve => io.close(resolve)); });
async function setup(page, { rol = 'Administrador', authenticated = true, active = [], delayActive = 0, autoMs = 30000 } = {}) {
  const usuario = { id: 'nurse-1', email: 'equipo@hospital.test', rol };
  const areas = PLANO_REFERENCIA.map((area, index) => ({ ...area, id: index + 1 }));
  const camas = [{ id: 1, area_id: 9, nombre: 'Cama 1', coordenadas_x: 51, coordenadas_y: 57 }];
  const enfermera = { id: 'nurse-2', nombre: 'Enfermera Demo', email: 'enfermera@hospital.test', rol: 'Generico', area_asignada_id: 4, turno: 'Manana', created_at: new Date().toISOString() };
  let users = [usuario,enfermera];
  let pending = [...active];
  let pacientes = [{ id: 1, nombre: 'Paciente de prueba', dni: '12345678', datos_medicos: 'Observación', area_id: 9, cama_id: 1, enfermero_asignado_id: enfermera.id, enfermero: enfermera }];
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
    } else if (path === '/api/areas' && request.method() === 'POST') { result = { ...body, id: 13 }; areas.push(result); }
    else if (path.startsWith('/api/areas/') && request.method() === 'PUT') { const index = areas.findIndex(row => row.id === Number(path.split('/').at(-1))); result = { ...areas[index], ...body }; areas[index] = result; }
    else if (path.startsWith('/api/areas/') && request.method() === 'DELETE') { areas.splice(areas.findIndex(row => row.id === Number(path.split('/').at(-1))), 1); return route.fulfill({ status: 204 }); }
    else if (path === '/api/areas') result = areas;
    else if (path === '/api/camas' && request.method() === 'POST') { result={...body,id:2}; camas.push(result); }
    else if (path.startsWith('/api/camas/') && request.method() === 'PUT') { const index=camas.findIndex(row=>row.id===Number(path.split('/').at(-1))); result={...camas[index],...body}; camas[index]=result; }
    else if (path.startsWith('/api/camas/') && request.method() === 'DELETE') { camas.splice(camas.findIndex(row=>row.id===Number(path.split('/').at(-1))),1); return route.fulfill({status:204}); }
    else if (path === '/api/camas') result = camas;
    else if (path === '/api/auth/usuarios') result = users;
    else if (path === '/api/enfermeros') result = users.filter(row=>row.rol==='Generico').map(row=>({...row,area:areas.find(area=>area.id===row.area_asignada_id),pacientes_asignados:pacientes.filter(p=>p.enfermero_asignado_id===row.id).length}));
    else if (path === '/api/auth/register') { result = { ...body, id: 'new-user', password: undefined, created_at: new Date().toISOString() }; users.push(result); }
    else if (path.startsWith('/api/auth/usuarios/') && request.method()==='PUT') { const id = path.split('/')[4]; result={...users.find(row=>row.id===id),...body}; users=users.map(row=>row.id===result.id?result:row); }
    else if (path.startsWith('/api/auth/usuarios/') && request.method()==='DELETE') { users=users.filter(row=>row.id!==path.split('/').at(-1)); return route.fulfill({status:204}); }
    else if (path === '/api/pacientes' && request.method() === 'POST') {
      result = { ...body, id: 2 }; pacientes.push(result);
    } else if (path.startsWith('/api/pacientes/') && request.method() === 'PUT') {
      result = { ...body, id: Number(path.split('/').at(-1)) }; pacientes = pacientes.map(row => row.id === result.id ? result : row);
    } else if (path.startsWith('/api/pacientes/') && request.method() === 'DELETE') {
      pacientes = pacientes.filter(row => row.id !== Number(path.split('/').at(-1))); return route.fulfill({ status: 204 });
    } else if (path === '/api/pacientes') result = pacientes;
    else if (path === '/api/llamados/activos') { if (delayActive) await new Promise(resolve => setTimeout(resolve, delayActive)); result = pending; }
    else if (path === '/api/llamados/crear') {
      result={...body,id:55,llamado_id:55,estado:'No Atendido',es_simulacion:true,
        paciente:pacientes.find(row=>row.id===body.paciente_id),area:areas.find(row=>row.id===body.area_id),
        cama:body.origen==='Cama'?camas[0]:null,enfermero_destino:enfermera,enfermero_destino_id:enfermera.id,
        area_enfermero:areas.find(row=>row.id===4),fecha_hora_activacion:new Date().toISOString()};
      pending.push(result); io.emit('nuevoLlamado',result); if(body.tipo==='Emergencia') io.emit('codigoAzul',result);
      automaticTimers.push(setTimeout(()=>{if(pending.some(row=>row.id===55)){pending=pending.filter(row=>row.id!==55);io.emit('llamadoAtendido',{id:55,enfermero:enfermera,tiempo_respuesta_segundos:30,atencion_automatica:true});}},autoMs));
    }
    else if (path.endsWith('/atender')) { const id=Number(path.split('/').at(-2)); pending=pending.filter(row=>row.id!==id); result = {id,enfermero:usuario,tiempo_respuesta_segundos:15}; io.emit('llamadoAtendido', result); }
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
  await expect(page.getByRole('button', { name: 'Nuevo Paciente' })).toBeVisible();
  await page.route('**/api/pacientes*', route => route.fulfill({ status: 401, json: { error: 'Token expirado' } }));
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(page).toHaveURL(/login/);
});
test('CRUD pacientes, contrato español y cierre accesible del modal', async ({ page }) => {
  const { calls } = await setup(page, { rol: 'Generico' });
  await page.goto('/pacientes');
  await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
  await page.getByLabel('Nombre completo').fill('Ana Prueba');
  await page.getByLabel('DNI', { exact: true }).fill('23456789');
  await page.getByLabel('Área', { exact: true }).selectOption('10');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page.getByRole('cell', { name: 'Ana Prueba', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar notificación' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Registro guardado correctamente.' })).toHaveCount(0);
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
  await page.getByRole('button', { name: 'Atender llamado', exact: true }).click();
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

test('enfermeros: alta, edición, contador y selector de pacientes', async ({ page }) => {
  const { calls } = await setup(page);
  await page.goto('/enfermeros');
  await expect(page.getByRole('cell', { name: 'Enfermera Demo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo Enfermero' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Ana Enfermera');
  await page.getByLabel('Email', { exact: true }).fill('ana@hospital.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('password-de-prueba');
  await page.getByLabel('Área asignada').selectOption('9');
  await page.getByLabel('Turno').selectOption('Noche');
  await page.getByRole('button', { name: 'Crear enfermero' }).click();
  const row=page.getByRole('row').filter({hasText:'ana@hospital.test'});
  await expect(row).toBeVisible();
  expect(calls.find(call=>call.path==='/api/auth/register').body).toMatchObject({rol:'Generico',area_asignada_id:9,turno:'Noche',nombre:'Ana Enfermera'});
  await row.getByRole('button',{name:'Editar',exact:true}).click();
  await page.getByLabel('Turno').selectOption('Tarde');
  await page.getByRole('button',{name:'Guardar cambios'}).click();
  await expect(row.getByRole('cell',{name:'Tarde'})).toBeVisible();
  await page.getByRole('link',{name:'Pacientes',exact:true}).click();
  await page.getByRole('button',{name:'Nuevo Paciente'}).click();
  await expect(page.getByLabel('Enfermero asignado').locator('option').filter({hasText:'Ana Enfermera'})).toHaveCount(1);
});

test('usuarios: cambiar rol y eliminar con confirmación', async ({ page }) => {
  const { calls } = await setup(page); await page.goto('/usuarios');
  const row=page.getByRole('row').filter({hasText:'enfermera@hospital.test'});
  await row.getByRole('button',{name:'Editar rol'}).click();
  await page.getByLabel('Rol',{exact:true}).selectOption('Administrador');
  await page.getByRole('button',{name:'Guardar cambios'}).click();
  await expect(row.getByRole('cell',{name:'Administrador',exact:true})).toBeVisible();
  expect(calls.find(call => call.method === 'PUT').path).toBe('/api/auth/usuarios/nurse-2/rol');
  await row.getByRole('button',{name:'Eliminar',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Enfermera Demo');
  await page.getByRole('dialog').getByRole('button',{name:'Eliminar',exact:true}).click();
  await expect(row).toHaveCount(0);
});

test('camas: crear, editar, filtrar y eliminar', async ({ page }) => {
  const { calls }=await setup(page); await page.goto('/camas');
  await page.getByRole('button',{name:'Nueva Cama'}).click();
  await page.getByLabel('Nombre',{exact:true}).fill('Cama Demo');
  await page.getByLabel('Área',{exact:true}).selectOption('10');
  await page.getByLabel('Coordenada X (%)',{exact:true}).fill('80');
  await page.getByLabel('Coordenada Y (%)',{exact:true}).fill('56');
  await page.getByRole('button',{name:'Guardar cama'}).click();
  const row=page.getByRole('row').filter({hasText:'Cama Demo'});
  await expect(row).toBeVisible();
  expect(calls.find(call=>call.path==='/api/camas' && call.method==='POST').body).toMatchObject({area_id:10,coordenadas_x:80,coordenadas_y:56});
  await page.getByLabel('Filtrar por área').selectOption('9'); await expect(row).toHaveCount(0);
  await page.getByLabel('Filtrar por área').selectOption('10');
  await row.getByRole('button',{name:'Editar',exact:true}).click();
  await page.getByLabel('Nombre',{exact:true}).fill('Cama Editada'); await page.getByRole('button',{name:'Guardar cama'}).click();
  const edited=page.getByRole('row').filter({hasText:'Cama Editada'});
  await edited.getByRole('button',{name:'Eliminar',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Eliminar',exact:true}).click();
  await expect(edited).toHaveCount(0);
});

test('áreas: crear, corregir geometría, editar y eliminar', async ({ page }) => {
  const { calls } = await setup(page); await page.goto('/areas');
  await page.getByRole('button', { name: 'Nueva Área' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Área Prueba');
  await page.getByLabel('Centro X (%)').fill('0');
  await page.getByRole('button', { name: 'Guardar área' }).click();
  expect(calls.filter(call => call.path === '/api/areas' && call.method === 'POST')).toHaveLength(0);
  await page.getByLabel('Centro X (%)').fill('50');
  await page.getByRole('button', { name: 'Guardar área' }).click();
  const row = page.getByRole('row').filter({ hasText: 'Área Prueba' });
  await expect(row).toBeVisible();
  expect(calls.find(call => call.path === '/api/areas' && call.method === 'POST').body)
    .toMatchObject({ tipo: 'Habitacion', coordenadas_x: 50, coordenadas_y: 50, ancho: 20, alto: 18 });
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Área Editada');
  await page.getByRole('button', { name: 'Guardar área' }).click();
  const edited = page.getByRole('row').filter({ hasText: 'Área Editada' });
  await edited.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(edited).toHaveCount(0);
});

test('simulación completa: modal, pulso, movimiento, llegada y atención manual', async ({ page }) => {
  const { calls }=await setup(page); await page.goto('/dashboard');
  await expect(page.getByText('Llamados activos sincronizados.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'SIMULAR CÓDIGO AZUL'}).click();
  await page.getByLabel('Paciente',{exact:true}).selectOption('1');
  await page.getByRole('button',{name:'ACTIVAR ALARMA'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Paciente de prueba · Llamado activo',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Alarma en Habitación 1',{exact:true})).toBeVisible();
  await expect(page.getByRole('alert').filter({hasText:'CÓDIGO AZUL'})).toBeVisible();
  await expect(page.getByLabel('Enfermera Demo · Caminando',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Atender llamado 55',exact:true})).toBeVisible({timeout:6000});
  await expect(page.getByText('🏃 Enfermera Demo llegó a Habitación 1', { exact: false })).toHaveCount(1);
  await page.getByRole('button',{name:'Atender llamado 55',exact:true}).click();
  await expect(page.getByText('No hay llamados pendientes')).toBeVisible();
  await expect(page.getByLabel('Alarma en Habitación 1',{exact:true})).toHaveCount(0);
  expect(calls.filter(call=>call.path==='/api/llamados/crear')).toHaveLength(1);
  expect(calls.find(call=>call.path==='/api/llamados/crear').body).toMatchObject({paciente_id:1,area_id:9,simulacion:true,origen:'Cama',tipo:'Emergencia'});
  await page.screenshot({path:'test-results/demo-atendido.png',fullPage:true});
});

test('simulación desde cama: atención automática recibida por socket', async ({ page }) => {
  const { calls }=await setup(page,{autoMs:6000}); await page.goto('/dashboard');
  await expect(page.getByText('Llamados activos sincronizados.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Simular alarma para Paciente de prueba',exact:true}).click();
  await expect(page.getByLabel('Paciente de prueba · Llamado activo',{exact:true})).toBeVisible();
  await expect(page.getByText('Atención automática del demo',{exact:false})).toBeVisible({timeout:9000});
  await expect(page.getByText('No hay llamados pendientes')).toBeVisible();
  expect(calls.filter(call=>call.path.endsWith('/atender'))).toHaveLength(0);
});

test('simulación normal desde baño mantiene el origen y no muestra alerta roja', async ({ page }) => {
  const { calls }=await setup(page); await page.goto('/dashboard');
  await page.getByRole('button',{name:'SIMULAR CÓDIGO AZUL'}).click();
  await page.getByLabel('Paciente',{exact:true}).selectOption('1');
  await page.getByLabel('Origen',{exact:true}).selectOption('Baño');
  await page.getByLabel('Tipo',{exact:true}).selectOption('Normal');
  await page.getByLabel('Baño de origen').selectOption('7');
  await page.getByRole('button',{name:'ACTIVAR ALARMA'}).click();
  await expect(page.getByLabel('Alarma en Baño 1',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Atender llamado 55',exact:true})).toBeVisible({timeout:6000});
  await expect(page.getByRole('alert').filter({hasText:'CÓDIGO AZUL'})).toHaveCount(0);
  expect(calls.find(call=>call.path==='/api/llamados/crear').body).toMatchObject({area_id:7,origen:'Baño',tipo:'Normal'});
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

## Contrato e integración

El backend de este repositorio está en `backend/` y acepta los nombres del frontend. Aplicar `backend/supabase/migrations/20260930140537_demo_codigo_azul.sql` al esquema existente. Para una base nueva, instalar primero `backend/supabase/schema.sql`. Preparación y prueba del demo: [DEMO.md](../DEMO.md).

| Recurso | Frontend | Backend |
| --- | --- | --- |
| Coordenadas | coordenadas_x, coordenadas_y | La migración normaliza PostgreSQL a estos nombres |
| Dimensiones de áreas | ancho, alto | Persistidas en PostgreSQL |
| Tipos de área | Ocho tipos | Los ocho tipos admitidos |
| Enfermero del paciente | enfermero_asignado_id | Selector cargado desde GET /api/enfermeros |
| Origen | Cama / Baño | Acepta Baño y Bano; devuelve Baño |
| Listado de perfiles | GET /api/auth/usuarios, solo admin | Listado paginado protegido |

Las escrituras mantienen el contrato solicitado. El mapa admite también coord_x/coord_y y dimensiones de referencia para áreas conocidas; la tabla muestra los datos persistidos. La lectura admite enfermero_id, fecha_activacion y tiempo_respuesta_seg como aliases.

Usuarios permite crear, cambiar rol y eliminar; Enfermeros agrega nombre, área, turno y contador de pacientes; Camas permite CRUD y filtro por área. Los enfermeros del mapa se cargan desde GET /api/enfermeros y parten de su área asignada. El servidor decide el enfermero disponible para cada simulación; las posiciones muestran la animación del demo.

Administrador y Generico pueden crear, editar y eliminar pacientes. Gestionar áreas, camas y usuarios requiere Administrador. El backend valida los permisos en cada operación.

## Endpoints

- POST /api/auth/login, GET /api/auth/me, POST /api/auth/register.
- GET/POST /api/pacientes; PUT/DELETE /api/pacientes/:id.
- GET/POST /api/areas; PUT/DELETE /api/areas/:id; GET/POST /api/camas; PUT/DELETE /api/camas/:id.
- GET /api/auth/usuarios; PUT /api/auth/usuarios/:id/rol; PUT/DELETE /api/auth/usuarios/:id; GET /api/enfermeros.
- POST /api/llamados/crear con simulacion: true desde el modal o una cama ocupada.
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

El socket autentica con token; el servidor incorpora la conexión a hospital y a la sala personal. Escucha nuevoLlamado, llamadoAtendido, codigoAzul, logSistema y notificacionEnfermero. Al conectar o reconectar obtiene los llamados activos y reconcilia eventos recibidos durante la consulta; también consulta cada diez segundos. La consola conserva los últimos 500 eventos. Las desconexiones marcan el estado como no sincronizado. El overlay dura tres segundos y respeta movimiento reducido. La atención automática del demo ocurre en el servidor a los treinta segundos y permanece operativa al cerrar la pestaña.

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
