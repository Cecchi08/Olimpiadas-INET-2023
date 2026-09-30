import { dbResult } from '../utils/errors.js';
import { normalizarRegistro, presentarRegistro } from '../utils/contrato.js';

export function createSimulationService({ db, publish, setTimer = setTimeout, clearTimer = clearTimeout }) {
  const timers = new Map();
  let worker;
  let recovering = false;
  const log = (tipo, mensaje) => publish('logSistema', { tipo, mensaje, timestamp: new Date().toISOString() });
  function cancel(id) {
    for (const timer of timers.get(String(id)) || []) clearTimer(timer);
    timers.delete(String(id));
  }
  function later(id, delay, action) {
    const timer = setTimer(() => { Promise.resolve().then(action).catch(error => {
      console.error('Simulación pendiente de reintento', { id, status: error.status || 503 });
    }); }, Math.max(0, delay));
    timer.unref?.();
    const key = String(id);
    timers.set(key, [...(timers.get(key) || []), timer]);
  }
  async function attend(id, actor, automatic = false) {
    const row = normalizarRegistro(dbResult(await db.rpc('atender_llamado', {
      p_id: Number(id), p_enfermero_id: actor, p_automatica: automatic
    })));
    cancel(id);
    const event = presentarRegistro({ ...row, llamado_id: row.id, timestamp: row.fecha_atencion || new Date().toISOString() });
    publish('llamadoAtendido', event);
    log('info', `✅ Llamado #${row.id} atendido${automatic ? ' automáticamente (demo)' : ''}. Tiempo: ${row.tiempo_respuesta_seg}s`);
    return event;
  }
  function schedule(row, notify = false) {
    if (!row.es_simulacion || !row.atencion_automatica_en || !row.enfermero_destino_id) return;
    cancel(row.id);
    if (notify) later(row.id, 1000, () => publish('notificacionEnfermero', {
      llamado_id: row.id, area: row.area, paciente: row.paciente,
      mensaje: `Código Azul: dirigirse a ${row.area?.nombre || 'área indicada'}`
    }, `usuario:${row.enfermero_destino_id}`));
    later(row.id, Date.parse(row.atencion_automatica_en) - Date.now() + 20, async () => {
      try { await attend(row.id, row.enfermero_destino_id, true); }
      catch (error) {
        cancel(row.id);
        if (![404, 409].includes(error.status)) throw error;
      }
    });
  }
  async function create(input, user, simulation = false) {
    const row = normalizarRegistro(dbResult(await db.rpc('crear_llamado', {
      p_paciente_id: input.paciente_id, p_area_id: input.area_id ?? null,
      p_origen: input.origen, p_tipo: input.tipo, p_simulacion: simulation, p_actor_id: user.id
    })));
    const event = { ...presentarRegistro(row), llamado_id: row.id, timestamp: row.fecha_activacion };
    publish('nuevoLlamado', event);
    if (row.tipo === 'Emergencia') publish('codigoAzul', event);
    log('warning', `🔵 ${row.paciente?.nombre || 'Paciente'} activó Código Azul en ${row.area?.nombre || 'el área'} (${event.origen})`);
    log('info', `💾 Llamado registrado en BD con ID ${row.id}`);
    log('info', '📡 Notificación enviada a enfermeros del área');
    schedule(event, true);
    return event;
  }
  async function recover() {
    if (recovering) return;
    recovering = true;
    try {
      let cursor = 0;
      while (true) {
        const rows = dbResult(await db.from('llamados').select('*').eq('es_simulacion', true)
          .eq('estado', 'No Atendido').gt('id', cursor).order('id').limit(200));
        if (!rows.length) break;
        for (const row of rows) if (!timers.has(String(row.id))) schedule(row);
        cursor = rows.at(-1).id;
      }
    } finally { recovering = false; }
  }
  return { create, attend, recover,
    start() {
      const run = () => recover().catch(error => console.error('Revisar migración del demo', { status: error.status || 503 }));
      run(); worker = setInterval(run, 5000); worker.unref();
    },
    stop() { clearInterval(worker); for (const id of timers.keys()) cancel(id); }
  };
}
