import { motion, useReducedMotion } from 'framer-motion';
import { posicion } from '../utils/constantes';
import styles from './Avatar.module.css';
export default function Avatar({ tipo = 'cama', nombre, coordenadas_x, coordenadas_y, alerta = false }) {
  const reduce = useReducedMotion();
  return <div className={styles.avatar} style={posicion({ coordenadas_x, coordenadas_y })} title={nombre} aria-label={nombre + (alerta ? ' · Llamado activo' : '')}>
    {alerta && <motion.span className={styles.pulse} animate={reduce ? {} : { scale: [1, 1.5, 1], opacity: [.8, .3, .8] }} transition={{ duration: 1, repeat: Infinity }} />}
    <span className={styles[tipo]}>{tipo === 'paciente' ? 'P' : tipo === 'enfermero' ? 'E' : '·'}</span>
    {tipo !== 'cama' && <small>{nombre}</small>}
  </div>;
}
