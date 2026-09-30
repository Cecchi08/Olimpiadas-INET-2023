import { useRecursos } from '../hooks/useRecursos';
import { useCrud } from '../hooks/useCrud';
import { TIPOS_AREA, NOMBRES_TIPO } from '../utils/constantes';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import Feedback from '../components/Feedback';
import styles from './Areas.module.css';
import ui from '../styles/ui.module.css';
export default function Areas() {
  const { data, loading, error, reload } = useRecursos(['/api/areas']);
  const crud = useCrud('/api/areas', reload);
  const rows = data['/api/areas'] || [];
  const columns = [{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }, { key: 'tipo', label: 'Tipo', render: row => <span className={ui.badge}>{NOMBRES_TIPO[row.tipo] || row.tipo}</span> }, ...[['coordenadas_x', 'X (%)'], ['coordenadas_y', 'Y (%)'], ['ancho', 'Ancho (%)'], ['alto', 'Alto (%)']].map(([key, label]) => ({ key, label }))];
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['coordenadas_x', 'coordenadas_y', 'ancho', 'alto']) values[key] = Number(values[key]);
    const form = event.currentTarget;
    const fits = values.coordenadas_x >= values.ancho / 2 && values.coordenadas_x + values.ancho / 2 <= 100 && values.coordenadas_y >= values.alto / 2 && values.coordenadas_y + values.alto / 2 <= 100;
    form.elements.ancho.setCustomValidity(fits ? '' : 'El área debe quedar dentro del plano (0–100%).');
    if (!form.reportValidity()) return;
    await crud.save({ ...values, nombre: values.nombre.trim() });
  }
  return <div className={styles.page}><div className={ui.header}><div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>Áreas del hospital</h1><p className={ui.subtitle}>Organizá los espacios y su ubicación en el plano.</p></div><button className={ui.primary} onClick={() => crud.edit()}>＋ Nueva Área</button></div>
    <p className={styles.hint}>Las coordenadas indican el centro de cada área. Todas las medidas se expresan en porcentajes del plano.</p>
    <Feedback success={crud.success} loading={loading} />
    {error && <p className={ui.error} role="alert">{error} <button className={ui.secondary} onClick={reload}>Reintentar</button></p>}
    <TablaGenerica columns={columns} rows={rows} loading={loading} actions={row => <><button className={ui.secondary} onClick={() => crud.edit(row)}>Editar</button><button className={ui.danger} onClick={() => crud.remove(row)}>Eliminar</button></>} />
    {crud.editing && <Modal title={crud.editing.id ? 'Editar área' : 'Nueva área'} onClose={crud.close}><form className={ui.form} onSubmit={submit} onChange={event => event.currentTarget.elements.ancho.setCustomValidity('')}>
      <label className={ui.field}>Nombre<input name="nombre" defaultValue={crud.editing.nombre || ''} required maxLength={120} disabled={crud.busy} /></label>
      <label className={ui.field}>Tipo<select name="tipo" defaultValue={crud.editing.tipo || 'Habitacion'} disabled={crud.busy}>{TIPOS_AREA.map(tipo => <option key={tipo} value={tipo}>{NOMBRES_TIPO[tipo]}</option>)}</select></label>
      <div className={styles.geometry}>{[['coordenadas_x', 'Centro X', 50], ['coordenadas_y', 'Centro Y', 50], ['ancho', 'Ancho', 20], ['alto', 'Alto', 18]].map(([key, label, fallback]) => <label key={key} className={ui.field}>{label} (%)<input type="number" name={key} min={key === 'ancho' || key === 'alto' ? .1 : 0} max="100" step=".1" defaultValue={crud.editing[key] ?? fallback} required disabled={crud.busy} /></label>)}</div>
      {crud.error && <p className={ui.error} role="alert">{crud.error}</p>}<div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button><button className={ui.primary} disabled={crud.busy}>{crud.busy ? 'Guardando…' : 'Guardar área'}</button></div>
    </form></Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
