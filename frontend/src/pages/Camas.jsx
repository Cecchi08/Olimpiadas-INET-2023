import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useRecursos } from '../hooks/useRecursos';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import Feedback from '../components/Feedback';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import styles from './Camas.module.css';
import ui from '../styles/ui.module.css';
export default function Camas() {
  const { data, loading, error, reload } = useRecursos(['/api/camas', '/api/areas']);
  const crud = useCrud('/api/camas', reload);
  const [area, setArea] = useState('');
  const areas = data['/api/areas'] || [];
  const rows = (data['/api/camas'] || []).filter(row => !area || String(row.area_id) === area);
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    await crud.save({ nombre: values.nombre.trim(), area_id: Number(values.area_id),
      coordenadas_x: Number(values.coordenadas_x), coordenadas_y: Number(values.coordenadas_y) });
  }
  return <div className={styles.page}>
    <div className={ui.header}><div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>Camas</h1><p className={ui.subtitle}>Ubicación y distribución por área.</p></div><button className={ui.primary} disabled={loading || Boolean(error)} onClick={() => crud.edit()}>＋ Nueva Cama</button></div>
    <label className={`${ui.field} ${styles.filter}`}>Filtrar por área<select aria-label="Filtrar por área" value={area} onChange={event => setArea(event.target.value)}><option value="">Todas las áreas</option>{areas.map(row => <option key={row.id} value={row.id}>{row.nombre}</option>)}</select></label>
    <Feedback loading={loading} error={error} success={crud.success} />
    <TablaGenerica rows={rows} loading={loading} columns={[
      { key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' },
      { key: 'area_id', label: 'Área', render: row => areas.find(area => area.id === row.area_id)?.nombre || row.area?.nombre || '—' },
      { key: 'coordenadas_x', label: 'X (%)' }, { key: 'coordenadas_y', label: 'Y (%)' }
    ]} actions={row => <><button className={ui.secondary} onClick={() => crud.edit(row)}>Editar</button><button className={ui.danger} onClick={() => crud.remove(row)}>Eliminar</button></>} />
    {crud.editing && <Modal title={crud.editing.id ? 'Editar cama' : 'Nueva cama'} onClose={crud.close}><form className={ui.form} onSubmit={submit}>
      <label className={ui.field}>Nombre<input name="nombre" defaultValue={crud.editing.nombre || ''} required maxLength={80} disabled={crud.busy} /></label>
      <label className={ui.field}>Área<select aria-label="Área" name="area_id" defaultValue={crud.editing.area_id || area || ''} required disabled={crud.busy}><option value="">Seleccionar área</option>{areas.map(row => <option key={row.id} value={row.id}>{row.nombre}</option>)}</select></label>
      <div className={ui.row}>{['x','y'].map(axis => <label className={ui.field} key={axis}>Coordenada {axis.toUpperCase()} (%)<input name={`coordenadas_${axis}`} type="number" min="0" max="100" step=".1" defaultValue={crud.editing[`coordenadas_${axis}`] ?? 50} required disabled={crud.busy} /></label>)}</div>
      <Feedback error={crud.error} /><div className={ui.formFooter}><button type="button" className={ui.secondary} onClick={crud.close} disabled={crud.busy}>Cancelar</button><button className={ui.primary} disabled={crud.busy} aria-busy={crud.busy}>{crud.busy ? 'Guardando…' : 'Guardar cama'}</button></div>
    </form></Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
