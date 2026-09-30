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
