import { useState } from 'react';
import { useRecursos } from '../hooks/useRecursos';
import api, { mensajeError } from '../services/api';
import { ROLES } from '../utils/constantes';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import styles from './Usuarios.module.css';
import ui from '../styles/ui.module.css';
export default function Usuarios() {
  const { data, loading, error, reload } = useRecursos(['/api/usuarios']);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState([]);
  const [success, setSuccess] = useState('');
  const rows = [...new Map([...(data['/api/usuarios'] || []), ...created].map(row => [row.id, row])).values()];
  async function submit(event) {
    event.preventDefault(); setBusy(true); setFormError('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data: result } = await api.post('/api/auth/register', { ...form, email: form.email.trim() });
      setCreated(previous => [...previous, result.usuario || result]); setOpen(false);
      setSuccess(`Usuario ${form.email} creado correctamente.`); reload();
    } catch (err) { setFormError(mensajeError(err)); }
    finally { setBusy(false); }
  }
  return <div className={styles.page}><div className={ui.header}><div><p className={ui.eyebrow}>ADMINISTRACIÓN</p><h1 className={ui.title}>Usuarios</h1><p className={ui.subtitle}>Administrá el acceso del equipo hospitalario.</p></div><button className={ui.primary} onClick={() => { setOpen(true); setFormError(''); }}>＋ Nuevo Usuario</button></div>
    {error && <div className={ui.error} role="alert">No se pudo cargar el directorio de usuarios: {error}<button className={ui.secondary} onClick={reload}>Reintentar</button></div>}
    {success && <p className={ui.notice} role="status">{success}</p>}
    <TablaGenerica rows={rows} loading={loading} empty={error ? 'Directorio no disponible. Los usuarios creados en esta sesión se mostrarán aquí.' : 'No hay usuarios registrados.'} columns={[{ key: 'email', label: 'Email' }, { key: 'rol', label: 'Rol', render: row => <span className={ui.badge}>{row.rol}</span> }]} />
    <p className={styles.note}>Los administradores pueden gestionar áreas y usuarios. El personal de salud accede al monitoreo, pacientes y reportes.</p>
    {open && <Modal title="Nuevo usuario" onClose={() => { if (!busy) setOpen(false); }}><form className={ui.form} onSubmit={submit}><label className={ui.field}>Email<input type="email" name="email" required autoComplete="off" disabled={busy} /></label><label className={ui.field}>Contraseña<input aria-label="Contraseña" type="password" name="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy} /><small>Entre 12 y 128 caracteres.</small></label><label className={ui.field}>Rol<select name="rol" defaultValue="Generico" disabled={busy}>{ROLES.map(rol => <option key={rol} value={rol}>{rol === 'Generico' ? 'Genérico · Personal de salud' : rol}</option>)}</select></label>{formError && <p className={ui.error} role="alert">{formError}</p>}<div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={busy} onClick={() => setOpen(false)}>Cancelar</button><button className={ui.primary} disabled={busy}>{busy ? 'Creando…' : 'Crear usuario'}</button></div></form></Modal>}
  </div>;
}

