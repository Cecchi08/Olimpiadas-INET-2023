import { motion, useReducedMotion } from 'framer-motion';
import { habilitarAudio } from '../utils/alarma';
import styles from './BotonCodigoAzul.module.css';
export default function BotonCodigoAzul({ onClick, disabled }) {
  const reduce = useReducedMotion();
  return <motion.button className={styles.button} disabled={disabled}
    animate={reduce || disabled ? {} : { boxShadow: ['0 0 0 0 #2563eb66', '0 0 0 10px #2563eb00'] }}
    transition={{ duration: 1.5, repeat: Infinity }} onClick={() => { habilitarAudio(); onClick(); }}>
    🚨 SIMULAR CÓDIGO AZUL
  </motion.button>;
}
