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
