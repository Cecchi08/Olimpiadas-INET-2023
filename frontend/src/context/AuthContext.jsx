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
