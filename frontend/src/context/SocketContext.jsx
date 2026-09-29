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
