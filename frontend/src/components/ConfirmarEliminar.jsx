import Modal from './Modal';
import ui from '../styles/ui.module.css';
export default function ConfirmarEliminar({ crud }) {
  if (!crud.deleting) return null;
  return <Modal title="Eliminar registro" onClose={crud.close}><p className={ui.subtitle}>Se eliminará «{crud.deleting.nombre}». Esta acción no se puede deshacer.</p>{crud.error && <p className={ui.error} role="alert">{crud.error}</p>}<div className={ui.formFooter}><button className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button><button className={ui.danger} disabled={crud.busy} onClick={crud.confirmDelete}>{crud.busy ? 'Eliminando…' : 'Eliminar'}</button></div></Modal>;
}

