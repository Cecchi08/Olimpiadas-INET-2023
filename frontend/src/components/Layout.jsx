import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSocket } from '../hooks/useSocket';
import styles from './Layout.module.css';
export default function Layout() {
  const { conectado } = useSocket();
  return <div className={styles.layout}><Sidebar /><div className={styles.workspace}>
    <header className={styles.topbar}><span>Central hospitalaria <span className={styles.separator}>/</span> <strong>Gestión de emergencias</strong></span><span className={conectado ? styles.online : styles.offline}><i />{conectado ? 'Sistema conectado' : 'Sin conexión en vivo'}</span></header>
    <main id="contenido" className={styles.main}><Outlet /></main>
    <footer className={styles.footer}><span>Código Azul · Atención conectada</span><span>Central de monitoreo hospitalario</span></footer>
  </div></div>;
}

