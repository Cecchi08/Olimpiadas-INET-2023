import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from './Icon';
import styles from './Sidebar.module.css';
export default function Sidebar() {
  const { usuario, rol, logout } = useAuth();
  const links = [['dashboard', 'Dashboard'], ['pacientes', 'Pacientes'], ...(rol === 'Administrador' ? [['areas', 'Áreas'], ['camas', 'Camas'], ['enfermeros', 'Enfermeros'], ['usuarios', 'Usuarios']] : []), ['reportes', 'Reportes']];
  return <aside className={styles.sidebar}>
    <a href="#contenido" className={styles.skip}>Ir al contenido</a>
    <NavLink to="/dashboard" className={styles.brand}><span className={styles.cross}>+</span><span>Código Azul<small>GESTIÓN HOSPITALARIA</small></span></NavLink>
    <div className={styles.navLabel}>ESPACIO DE TRABAJO</div>
    <nav className={styles.nav} aria-label="Navegación principal">{links.map(([path, label]) => <NavLink key={path} to={'/' + path} className={({ isActive }) => isActive ? styles.active : styles.link}><Icon name={path} />{label}</NavLink>)}</nav>
    <div className={styles.support}><Icon name="pulse" /><p>Cada segundo cuenta.<span>Conectados para cuidar.</span></p></div>
    <div className={styles.account}><span className={styles.avatar}>{usuario.email?.slice(0, 2).toUpperCase()}</span><div><strong title={usuario.email}>{usuario.email}</strong><small>{rol === 'Administrador' ? 'Administrador' : 'Personal de salud'}</small></div></div>
    <button className={styles.logout} onClick={logout}><Icon name="logout" size={17} />Cerrar sesión</button>
  </aside>;
}
