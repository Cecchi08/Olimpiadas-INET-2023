import { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { formatearHora } from '../utils/formateoFechas';
import styles from './Consola.module.css';
export default function Consola() {
  const { logs, conectado } = useSocket();
  const content = useRef(null);
  useEffect(() => { if (content.current) content.current.scrollTop = content.current.scrollHeight; }, [logs]);
  return <section className={styles.console} aria-label="Consola del sistema"><header><h2>🖥️ CONSOLA DEL SISTEMA</h2><span className={conectado ? styles.live : styles.offline}>{conectado ? 'EN VIVO' : 'OFFLINE'}</span></header><div className={styles.logs} ref={content} role="log" aria-live="polite" aria-relevant="additions">{logs.length ? logs.map(log => <p key={log.id} className={styles[log.tipo]}><time>[{formatearHora(log.timestamp)}]</time> {log.mensaje}</p>) : <p className={styles.wait}>Esperando eventos...<span className={styles.cursor}>▌</span></p>}</div><footer><span>●</span> {logs.length} eventos en esta sesión</footer></section>;
}

