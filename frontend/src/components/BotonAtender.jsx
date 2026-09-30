import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { mensajeError } from '../services/api';
import styles from './BotonAtender.module.css';
export default function BotonAtender({ llamado, x, y }) {
  const { atenderLlamado } = useSocket();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function attend() {
    setBusy(true); setError('');
    try { await atenderLlamado(llamado.id); }
    catch (failure) { setError(mensajeError(failure)); }
    finally { setBusy(false); }
  }
  return <div className={styles.anchor} style={{ left: `${Math.min(80, Math.max(20, x))}%`, top: `${Math.max(8, y - 6)}%` }}>
    <button className={styles.button} disabled={busy} aria-busy={busy} onClick={attend} aria-label={`Atender llamado ${llamado.id}`}>{busy ? 'Atendiendo…' : '✅ ATENDER LLAMADO'}</button>
    {error && <p className={styles.error} role="alert">{error}</p>}
  </div>;
}
