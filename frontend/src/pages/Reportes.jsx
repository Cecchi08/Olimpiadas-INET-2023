import { useEffect, useMemo, useState } from 'react';
import { useRecursos } from '../hooks/useRecursos';
import api, { listarTodos, mensajeError } from '../services/api';
import { filtrosReporte } from '../utils/formateoFechas';
import { normalizarEstadisticas, respuestaPorDia } from '../utils/reportes';
import GraficoBarras from '../components/GraficoBarras';
import GraficoPastel from '../components/GraficoPastel';
import GraficoLineas from '../components/GraficoLineas';
import styles from './Reportes.module.css';
import ui from '../styles/ui.module.css';
export default function Reportes() {
  const areas = useRecursos(['/api/areas']);
  const [filters, setFilters] = useState({ area_id: '', origen: '', desde: '', hasta: '' });
  const [state, setState] = useState({ loading: true, data: null, error: '', lineError: '' });
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');
  const [revision, setRevision] = useState(0);
  const invalid = Boolean(filters.desde && filters.hasta && filters.desde > filters.hasta);
  const params = useMemo(() => filtrosReporte(filters), [filters]);
  useEffect(() => {
    if (invalid) return;
    const controller = new AbortController();
    async function load() {
      setState({ loading: true, data: null, error: '', lineError: '' });
      try {
        const response = await api.get('/api/reportes/estadisticas', { params, signal: controller.signal });
        const data = normalizarEstadisticas(response.data);
        let lineError = '';
        if (!data.por_dia) {
          try { data.por_dia = respuestaPorDia(await listarTodos('/api/llamados', params, controller.signal)); }
          catch (err) { if (controller.signal.aborted) return; data.por_dia = []; lineError = mensajeError(err); }
        }
        if (!controller.signal.aborted) setState({ loading: false, data, error: '', lineError });
      } catch (err) { if (!controller.signal.aborted) setState({ loading: false, data: null, error: mensajeError(err), lineError: '' }); }
    }
    const timer = setTimeout(load, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [params, invalid, revision]);
  function change(event) { setFilters(previous => ({ ...previous, [event.target.name]: event.target.value })); }
  async function download(format) {
    setExporting(format); setExportError('');
    try {
      const response = await api.get(`/api/reportes/export/${format}`, { params, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url; link.download = `codigo-azul-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try { err.response.data = JSON.parse(await err.response.data.text()); } catch { /* El servidor puede responder texto o HTML. */ }
      }
      setExportError(mensajeError(err));
    } finally { setExporting(''); }
  }
  return <><div className={ui.header}><div><p className={ui.eyebrow}>ANÁLISIS Y SEGUIMIENTO</p><h1 className={ui.title}>Reportes</h1><p className={ui.subtitle}>Información para mejorar cada respuesta.</p></div><div className={ui.actions}><button className={ui.secondary} onClick={() => download('pdf')} disabled={Boolean(exporting) || invalid}>{exporting === 'pdf' ? 'Exportando…' : '📄 Exportar PDF'}</button><button className={ui.primary} onClick={() => download('csv')} disabled={Boolean(exporting) || invalid}>{exporting === 'csv' ? 'Exportando…' : '📊 Exportar CSV'}</button></div></div>
    <div className={styles.filters}><label className={ui.field}>Área<select aria-label="Área" name="area_id" value={filters.area_id} onChange={change}><option value="">Todas las áreas</option>{(areas.data['/api/areas'] || []).map(area => <option value={area.id} key={area.id}>{area.nombre}</option>)}</select></label><label className={ui.field}>Origen<select aria-label="Origen" name="origen" value={filters.origen} onChange={change}><option value="">Todos los orígenes</option><option value="Cama">Cama</option><option value="Baño">Baño</option></select></label><label className={ui.field}>Desde<input type="date" name="desde" value={filters.desde} onChange={change} max={filters.hasta || undefined} /></label><label className={ui.field}>Hasta<input type="date" name="hasta" value={filters.hasta} onChange={change} min={filters.desde || undefined} /></label></div>
    {areas.error && <p className={ui.error} role="alert">{areas.error}</p>}
    {(invalid || state.error || exportError) && <p className={ui.error} role="alert">{invalid ? 'La fecha desde debe ser anterior o igual a la fecha hasta.' : state.error || exportError}{state.error && <button className={ui.secondary} onClick={() => setRevision(value => value + 1)}>Reintentar</button>}</p>}
    {state.loading && !invalid ? <p className={ui.empty} role="status">Cargando estadísticas…</p> : !invalid && state.data && <>
      <div className={styles.totals}><article><span>Total de llamados</span><strong>{state.data.total_llamados ?? '—'}</strong></article><article><span>Atendidos</span><strong>{state.data.atendidos ?? '—'}</strong></article><article><span>Tiempo promedio</span><strong>{state.data.tiempo_promedio_respuesta_segundos ?? state.data.tiempo_promedio_respuesta_seg ?? '—'} <small>s</small></strong></article></div>
      <div className={styles.charts}><section><h2>Llamados por área</h2><p>Distribución de solicitudes en el hospital</p><GraficoBarras data={state.data.por_area} /></section><section><h2>Tipo de llamado</h2><p>Normales y emergencias</p><GraficoPastel data={state.data.por_tipo} /></section><section className={styles.wide}><h2>Tiempo de respuesta</h2><p>Promedio en segundos por día de activación · horario local</p>{state.lineError ? <p className={ui.error} role="alert">{state.lineError}</p> : <GraficoLineas data={state.data.por_dia || []} />}</section></div>
    </>}
  </>;
}

