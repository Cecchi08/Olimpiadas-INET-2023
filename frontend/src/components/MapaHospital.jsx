import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRecursos } from '../hooks/useRecursos';
import { useSocket } from '../hooks/useSocket';
import { normalizarArea } from '../utils/constantes';
import AreaMapa from './AreaMapa';
import Avatar from './Avatar';
import Icon from './Icon';
import styles from './MapaHospital.module.css';
import ui from '../styles/ui.module.css';

export default function MapaHospital() {
  const { data, loading, error, reload } = useRecursos(['/api/areas', '/api/camas', '/api/pacientes']);
  const { activos, alertaAzul } = useSocket();
  const [visibleAlert, setVisibleAlert] = useState(null);
  const reduce = useReducedMotion();
  const areas = useMemo(() => (data['/api/areas'] || []).map(normalizarArea), [data]);
  const camas = data['/api/camas'] || [];
  const pacientes = data['/api/pacientes'] || [];
  const enfermeros = useMemo(() => {
    const assigned = new Map();
    for (const patient of data['/api/pacientes'] || []) {
      const id = patient.enfermero_asignado_id ?? patient.enfermero_id;
      if (!id) continue;
      const key = `${id}-${patient.area_id}`;
      assigned.set(key, { id: key, nombre: patient.enfermero?.nombre || patient.enfermero?.email || 'Enfermero asignado', area_id: patient.area_id });
    }
    return [...assigned.values()];
  }, [data]);
  useEffect(() => {
    if (!alertaAzul) return;
    const show = setTimeout(() => setVisibleAlert(alertaAzul), 0);
    const hide = setTimeout(() => setVisibleAlert(null), 3000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [alertaAzul]);
  const geometryValid = area => [area.coordenadas_x, area.coordenadas_y, area.ancho, area.alto].every(value => value != null && Number.isFinite(Number(value)));
  return <section className={styles.panel}>
    <header className={styles.header}><div><span className={styles.icon}><Icon name="areas" size={18} /></span><h2>Mapa del hospital<small>Distribución de áreas y pacientes</small></h2></div><button className={ui.secondary} onClick={reload} disabled={loading} aria-label="Actualizar mapa">↻ Actualizar</button></header>
    {error && <p className={ui.error} role="alert">{error}</p>}
    <div className={styles.viewport}><div className={styles.map} aria-label="Plano del hospital, coordenadas sobre un canvas de 1920 por 1080">
      {loading && <p className={styles.state} role="status">Cargando plano del hospital…</p>}
      {!loading && !areas.length && <p className={styles.state}>{error ? 'Plano no disponible' : 'Todavía no hay áreas registradas.'}</p>}
      {areas.filter(geometryValid).map(area => <AreaMapa key={area.id} area={area} />)}
      {camas.map(cama => {
        const x = cama.coordenadas_x ?? cama.coord_x; const y = cama.coordenadas_y ?? cama.coord_y;
        if (x == null || y == null) return null;
        const patient = pacientes.find(item => String(item.cama_id) === String(cama.id));
        return <Avatar key={cama.id} tipo={patient ? 'paciente' : 'cama'} nombre={patient?.nombre || cama.nombre} coordenadas_x={x} coordenadas_y={y} alerta={Boolean(patient && activos.some(call => String(call.paciente_id) === String(patient.id)))} />;
      })}
      {enfermeros.map((enfermero, index) => {
        const area = areas.find(item => String(item.id) === String(enfermero.area_id));
        return area && geometryValid(area) ? <Avatar key={enfermero.id} tipo="enfermero" nombre={enfermero.nombre} coordenadas_x={Number(area.coordenadas_x) + Number(area.ancho) / 2 - 3 - (index % 2) * 3} coordenadas_y={Number(area.coordenadas_y) + Number(area.alto) / 2 - 3} /> : null;
      })}
      {visibleAlert && <motion.div key={visibleAlert.eventId} className={styles.alert} role="alert" initial={{ opacity: .3 }} animate={{ opacity: reduce ? .35 : [.3, .7, .3] }} transition={{ duration: 1, repeat: 2 }}><strong>CÓDIGO AZUL · {visibleAlert.area?.nombre || visibleAlert.area_nombre || 'Emergencia'}</strong></motion.div>}
    </div></div>
    <footer className={styles.legend}><div><span><i className={styles.patient} />Paciente</span><span><i className={styles.nurse} />Enfermero asignado</span><span><i className={styles.call} />Llamado activo</span><span><i className={styles.bed} />Cama libre</span></div><small>Vista de planta · 1920 × 1080</small></footer>
    {areas.some(area => !geometryValid(area)) && <p className={ui.notice}>Hay áreas sin coordenadas válidas que no pueden ubicarse en el plano.</p>}
  </section>;
}

