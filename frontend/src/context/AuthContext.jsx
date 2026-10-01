import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { AUTH_EXPIRED, TOKEN_KEY, mensajeError, setAuthenticatedToken } from '../services/api';
import { AuthContext } from './contexts';
import ui from '../styles/ui.module.css';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(0);
  const logout = useCallback(() => {
    version.current++;
    localStorage.removeItem(TOKEN_KEY);
    setAuthenticatedToken(null);
    setToken(null); setUsuario(null); setLoading(false); setError('');
    navigateRef.current('/login', { replace: true });
  }, []);
  const checkAuth = useCallback(async () => {
    const current = ++version.current;
    const stored = localStorage.getItem(TOKEN_KEY);
    setLoading(true); setError('');
    setAuthenticatedToken(null);
    if (!stored) { setToken(null); setUsuario(null); setLoading(false); return; }
    try {
      const { data } = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${stored}` }, skipAuthRedirect: true
      });
      if (current !== version.current || stored !== localStorage.getItem(TOKEN_KEY)) return;
      const profile = data.usuario || data;
      if (!profile.id || !(profile.rol || data.rol)) throw new Error('Respuesta de autenticación incompleta.');
      setUsuario({ ...profile, rol: profile.rol || data.rol }); setToken(stored);
      setAuthenticatedToken(stored);
    } catch (err) {
      if (current !== version.current || stored !== localStorage.getItem(TOKEN_KEY)) return;
      if (err.response?.status === 401) logout();
      else { setUsuario(null); setError(mensajeError(err)); }
    } finally {
      if (current === version.current) setLoading(false);
    }
  }, [logout]);
  useEffect(() => {
    const lifecycle = version;
    const timer = setTimeout(checkAuth, 0);
    const sync = event => { if (event.key === TOKEN_KEY || event.key === null) checkAuth(); };
    window.addEventListener(AUTH_EXPIRED, logout);
    window.addEventListener('storage', sync);
    return () => { clearTimeout(timer); lifecycle.current++; window.removeEventListener(AUTH_EXPIRED, logout); window.removeEventListener('storage', sync); };
  }, [checkAuth, logout]);
  async function login(email, password) {
    const current = ++version.current;
    const { data } = await api.post('/api/auth/login', { email, password }, { skipAuthRedirect: true });
    if (!data.token || !data.usuario) throw new Error('Respuesta de autenticación incompleta.');
    if (current !== version.current) return;
    localStorage.setItem(TOKEN_KEY, data.token);
    setAuthenticatedToken(data.token); setLoading(false);
    setToken(data.token); setUsuario({ ...data.usuario, rol: data.usuario.rol || data.rol }); setError('');
  }
  return <AuthContext.Provider value={{ usuario, token, rol: usuario?.rol, loading, error, login, logout, checkAuth }}>
    {loading ? <div className={ui.empty} role="status" aria-live="polite"><span className={ui.spinner} />Validando sesión…</div> :
      token && !usuario ? <div className={ui.card}><p className={ui.error} role="alert">{error || 'No se pudo validar la sesión.'}</p><button className={ui.primary} onClick={checkAuth}>Reintentar</button></div> : children}
  </AuthContext.Provider>;
}
