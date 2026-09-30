import { useState } from 'react';
import styles from './Toast.module.css';

export default function Toast({ tipo = 'success', mensaje, onClose }) {
  const [dismissed, setDismissed] = useState(false);
  if (!mensaje || dismissed) return null;
  const error = tipo === 'error';
  return <div className={`${styles.toast} ${error ? styles.error : styles.success}`}
    role={error ? 'alert' : 'status'} aria-atomic="true">
    <span aria-hidden="true">{error ? '⚠' : '✓'}</span>
    <span className={styles.message}>{mensaje}</span>
    <button type="button" aria-label="Cerrar notificación" onClick={() => {
      setDismissed(true); onClose?.();
    }}>×</button>
  </div>;
}
