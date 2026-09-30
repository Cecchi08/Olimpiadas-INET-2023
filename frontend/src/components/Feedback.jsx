import ui from '../styles/ui.module.css';
import Toast from './Toast';
export default function Feedback({ loading, error, success }) {
  return <>{loading && <p className={ui.loading} role="status"><span className={ui.spinner} />Cargando…</p>}
    {error && <Toast key={`error:${error}`} tipo="error" mensaje={error} />}
    {success && <Toast key={`success:${success}`} mensaje={success} />}</>;
}
