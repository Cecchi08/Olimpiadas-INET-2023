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
