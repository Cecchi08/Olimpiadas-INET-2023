import axios from 'axios';

export const TOKEN_KEY = 'codigoAzul.token';
export const AUTH_EXPIRED = 'codigoAzul:auth-expired';
let authenticatedToken = null;
export function setAuthenticatedToken(token) { authenticatedToken = token; }
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', timeout: 20000 });
api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  const requestToken = error.config?.headers?.Authorization;
  const path = error.config?.url?.split('?')[0];
  const publicPage = ['/', '/login'].includes(window.location.pathname);
  if (error.response?.status === 401 && !error.config?.skipAuthRedirect && !publicPage &&
      path !== '/api/auth/login' && path !== '/api/auth/me' &&
      authenticatedToken && requestToken === `Bearer ${authenticatedToken}` &&
      requestToken === `Bearer ${localStorage.getItem(TOKEN_KEY)}`) {
    authenticatedToken = null;
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
