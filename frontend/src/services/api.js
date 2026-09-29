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

