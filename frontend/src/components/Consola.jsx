import { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { formatearHora } from '../utils/formateoFechas';
import styles from './Consola.module.css';

const clasesLog = {
  info: styles.info,
  warning: styles.warning,
  danger: styles.danger,
};

export default function Consola() {
  const { logs, conectado } = useSocket();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
      container: 'nearest',
    });
  }, [logs]);

  return (
    <section className={styles.console} aria-label="Consola del sistema">
      <header className={styles.header}>
        <h2>🖥️ CONSOLA DEL SISTEMA</h2>
        <span className={conectado ? styles.live : styles.offline}>{conectado ? 'EN VIVO' : 'OFFLINE'}</span>
      </header>
      <div className={styles.logs} role="log" aria-label="Eventos del sistema" aria-live="polite" aria-relevant="additions" tabIndex={0}>
        {logs.length === 0 && <p className={styles.wait}>Esperando eventos...<span className={styles.cursor}>▌</span></p>}
        {logs.map(log => (
          <p key={log.id} className={`${styles.log} ${clasesLog[log.tipo] || clasesLog.info}`}>
            <time>[{formatearHora(log.timestamp)}]</time> {log.mensaje}
          </p>
        ))}
        <div ref={bottomRef} className={styles.bottom} aria-hidden="true" />
      </div>
      <footer className={styles.footer}><span>●</span> {logs.length} eventos en esta sesión</footer>
    </section>
  );
}
