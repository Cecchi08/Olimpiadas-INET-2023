import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { mensajeError } from '../services/api';
import Icon from '../components/Icon';
import styles from './Login.module.css';
import ui from '../styles/ui.module.css';
export default function Login() {
  const { login, usuario, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <p className={ui.empty}>Validando sesión…</p>;
  if (usuario) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const values = new FormData(event.currentTarget);
    try { await login(values.get('email').trim(), values.get('password')); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(mensajeError(err)); }
    finally { setBusy(false); }
  }
  return <main className={styles.page}><section className={styles.story}><div className={styles.brand}><span>+</span>Código Azul</div><div className={styles.message}><div className={styles.line}><Icon name="pulse" size={90} /></div><p>ATENCIÓN CONECTADA</p><h1>Cada segundo<br />hace la diferencia.</h1><h2>Un hospital conectado.<br />Un equipo listo para responder.</h2></div><footer>GESTIÓN DE EMERGENCIAS HOSPITALARIAS</footer></section><section className={styles.access}><div className={styles.formWrap}><span className={styles.label}>CENTRAL HOSPITALARIA</span><h2>Bienvenido de nuevo</h2><p>Ingresá con tu cuenta para acceder al sistema.</p><form className={ui.form} onSubmit={submit}><label className={ui.field}>Correo electrónico<input type="email" name="email" autoComplete="username" placeholder="nombre@hospital.com" required disabled={busy} /></label><label className={ui.field}>Contraseña<input type="password" name="password" autoComplete="current-password" placeholder="Ingresá tu contraseña" required disabled={busy} /></label>{error && <div role="alert" className={ui.error}>{error}</div>}<button className={ui.primary} disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar al sistema →'}</button></form><p className={styles.help}>¿Necesitás acceso? Contactá al administrador de tu hospital.</p></div><footer>Código Azul · Gestión hospitalaria</footer></section></main>;
}

