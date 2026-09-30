import { useRecursos } from '../hooks/useRecursos';
import { useCrud } from '../hooks/useCrud';
import { ROLES } from '../utils/constantes';
import TablaGenerica from './TablaGenerica';
import Modal from './Modal';
import ConfirmarEliminar from './ConfirmarEliminar';
import Feedback from './Feedback';
import styles from './PersonalPage.module.css';
import ui from '../styles/ui.module.css';

export default function PersonalPage({ enfermeros = false }) {
  const path = enfermeros ? '/api/enfermeros' : '/api/auth/usuarios';
  const { data, loading, error, reload } = useRecursos([path, '/api/areas']);
  const crud = useCrud('/api/auth/usuarios', reload, { createPath: '/api/auth/register',
    updatePath: id => `/api/auth/usuarios/${id}${enfermeros ? '' : '/rol'}` });
  const row = crud.editing;
  const title = enfermeros ? 'Enfermeros' : 'Usuarios';
  const columns = [
    ...(enfermeros ? [{ key: 'nombre', label: 'Nombre', render: value => value.nombre || value.email }] : []),
    { key: 'email', label: 'Email' },
    { key: 'rol', label: 'Rol' },
    ...(enfermeros ? [
      { key: 'area', label: 'Área asignada', render: value => value.area?.nombre || 'Sin asignar' },
      { key: 'turno', label: 'Turno', render: value => value.turno === 'Manana' ? 'Mañana' : value.turno || 'Sin asignar' },
      { key: 'pacientes_asignados', label: 'Pacientes asignados' }
    ] : [
      { key: 'created_at', label: 'Fecha de creación', render: value => value.created_at ? new Date(value.created_at).toLocaleDateString('es-AR') : '—' }
    ])
  ];
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (enfermeros) {
      values.rol = 'Generico';
      values.area_asignada_id = values.area_asignada_id ? Number(values.area_asignada_id) : null;
      values.turno = values.turno || null;
    }
    if (values.email) values.email = values.email.trim();
    await crud.save(values);
  }
  return <div className={styles.page}>
    <div className={ui.header}><div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>{title}</h1><p className={ui.subtitle}>Equipo hospitalario, accesos y asignaciones.</p></div>
      <button className={ui.primary} onClick={() => crud.edit()}>＋ {enfermeros ? 'Nuevo Enfermero' : 'Nuevo Usuario'}</button></div>
    <Feedback loading={loading} error={error} success={crud.success} />
    <TablaGenerica rows={data[path] || []} columns={columns} loading={loading} actions={value => <>
      <button className={ui.secondary} onClick={() => crud.edit(value)}>{enfermeros ? 'Editar' : 'Editar rol'}</button>
      <button className={ui.danger} onClick={() => crud.remove(value)}>Eliminar</button></>} />
    {row && <Modal title={row.id ? (enfermeros ? 'Editar enfermero' : 'Editar rol') : (enfermeros ? 'Nuevo enfermero' : 'Nuevo usuario')} onClose={crud.close}>
      <form className={ui.form} onSubmit={submit}>
        {enfermeros && <label className={ui.field}>Nombre<input name="nombre" defaultValue={row.nombre || ''} maxLength={160} required disabled={crud.busy} /></label>}
        {!row.id && <><label className={ui.field}>Email<input name="email" type="email" maxLength={254} required autoComplete="off" disabled={crud.busy} /></label>
          <label className={ui.field}>Contraseña<input aria-label="Contraseña" name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" disabled={crud.busy} /><small>Entre 12 y 128 caracteres.</small></label></>}
        {!enfermeros && <label className={ui.field}>Rol<select aria-label="Rol" name="rol" defaultValue={row.rol || 'Generico'} disabled={crud.busy}>{ROLES.map(rol => <option key={rol}>{rol}</option>)}</select></label>}
        {enfermeros && <div className={ui.row}>
          <label className={ui.field}>Área asignada<select aria-label="Área asignada" name="area_asignada_id" defaultValue={row.area_asignada_id || ''} required disabled={crud.busy}><option value="">Seleccionar área</option>{(data['/api/areas'] || []).map(area => <option key={area.id} value={area.id}>{area.nombre}</option>)}</select></label>
          <label className={ui.field}>Turno<select aria-label="Turno" name="turno" defaultValue={row.turno || 'Manana'} required disabled={crud.busy}><option value="Manana">Mañana</option><option>Tarde</option><option>Noche</option></select></label>
        </div>}
        <Feedback error={crud.error} />
        <div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button>
          <button className={ui.primary} disabled={crud.busy} aria-busy={crud.busy}>{crud.busy ? 'Guardando…' : row.id ? 'Guardar cambios' : enfermeros ? 'Crear enfermero' : 'Crear usuario'}</button></div>
      </form></Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
