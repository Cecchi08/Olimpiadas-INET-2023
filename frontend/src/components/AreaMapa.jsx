import { imagenArea, planoVectorial } from '../utils/imagenesAreas';
import { posicion } from '../utils/constantes';
import styles from './AreaMapa.module.css';
export default function AreaMapa({ area }) {
  return <><img className={styles.area} src={imagenArea(area)} alt={area.nombre} draggable="false" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = planoVectorial(area.tipo); }} style={{ ...posicion(area), width: `${area.ancho}%`, height: `${area.alto}%` }} /><span className={styles.label} style={{ left: `${area.coordenadas_x}%`, top: `${area.coordenadas_y - area.alto / 2 + 1.5}%` }}>{area.nombre}</span></>;
}

