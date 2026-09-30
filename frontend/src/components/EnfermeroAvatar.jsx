import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import styles from './EnfermeroAvatar.module.css';
export default function EnfermeroAvatar({ enfermero, inicio, destino, moviendo = false, onLlegada }) {
  const reduce = useReducedMotion();
  const [animando, setAnimando] = useState(false);
  const target = destino || inicio;
  return <motion.div className={styles.avatar} title={enfermero.nombre || enfermero.email}
    aria-label={`${enfermero.nombre || enfermero.email} · ${moviendo ? 'Caminando' : 'Enfermero'}`}
    initial={{ left: `${inicio.x}%`, top: `${inicio.y}%` }}
    animate={{ left: `${target.x}%`, top: `${target.y}%` }}
    transition={{ duration: reduce ? 0 : 3, ease: 'easeInOut' }} onAnimationStart={() => setAnimando(true)}
    onAnimationComplete={() => { setAnimando(false); onLlegada?.(); }}>
    <span aria-hidden="true" data-moviendo={moviendo || animando}>E</span><small>{enfermero.nombre || enfermero.email}</small>
  </motion.div>;
}
