import { useAuth } from '../hooks/useAuth';
import { useRecursos } from '../hooks/useRecursos';
import { useCrud } from '../hooks/useCrud';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import Feedback from '../components/Feedback';
import styles from './Usuarios.module.css';
import ui from '../styles/ui.module.css';

const path = '/api/auth/usuarios';
const columns = [
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol' },
  { key: 'created_at', label: 'Fecha de creación', render: row => row.created_at
    ? new Date(row.created_at).toLocaleDateString('es-AR') : '—' },
];

export default function Usuarios() {
  const { usuario } = useAuth();
  const { data, loading, error, reload } = useRecursos([path]);
  const crud = useCrud(path, reload, {
    createPath: '/api/auth/register',
    updatePath: id => `${path}/${encodeURIComponent(id)}/rol`,
  });
  const row = crud.editing;
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.email) values.email = values.email.trim();
    await crud.save(values);
  }
  return <div className={styles.page}>
    <header className={ui.header}>
      <div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>Usuarios</h1><p className={ui.subtitle}>Creá cuentas y administrá los permisos del equipo.</p></div>
      <button type="button" className={ui.primary} onClick={() => crud.edit()}>＋ Nuevo Usuario</button>
    </header>
    <Feedback loading={loading} error={error} success={crud.success} />
    {error && <button type="button" className={ui.secondary} onClick={reload}>Reintentar</button>}
    <TablaGenerica columns={columns} rows={data[path] || []} loading={loading} actions={user => <>
      <button type="button" className={ui.secondary} disabled={user.id === usuario?.id} onClick={() => crud.edit(user)}>Editar rol</button>
      <button type="button" className={ui.danger} disabled={user.id === usuario?.id} onClick={() => crud.remove(user)}>Eliminar</button>
    </>} />
    {row && <Modal title={row.id ? 'Editar rol' : 'Nuevo usuario'} onClose={crud.close}>
      <form className={ui.form} onSubmit={submit}>
        {row.id ? <p className={styles.email}>{row.email}</p> : <>
          <label className={ui.field}>Email<input name="email" type="email" maxLength={254} autoComplete="off" required disabled={crud.busy} /></label>
          <label className={ui.field}>Contraseña<input aria-label="Contraseña" name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required disabled={crud.busy} /><small>Entre 12 y 128 caracteres.</small></label>
        </>}
        <label className={ui.field}>Rol<select aria-label="Rol" name="rol" defaultValue={row.rol || 'Generico'} disabled={crud.busy} required>
          <option value="Administrador">Administrador</option><option value="Generico">Generico</option>
        </select></label>
        <Feedback error={crud.error} />
        <div className={ui.formFooter}>
          <button type="button" className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button>
          <button type="submit" className={ui.primary} disabled={crud.busy} aria-busy={crud.busy}>{crud.busy ? 'Guardando…' : row.id ? 'Guardar cambios' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
