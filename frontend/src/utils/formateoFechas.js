export function formatearHora(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--:--:--' : date.toLocaleTimeString('es-AR', { hour12: false });
}
export function formatearFecha(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-AR');
}
export function filtrosReporte({ area_id, origen, desde, hasta }) {
  return {
    ...(area_id && { area_id }), ...(origen && { origen }),
    ...(desde && { fecha_desde: new Date(`${desde}T00:00:00`).toISOString() }),
    ...(hasta && { fecha_hasta: new Date(`${hasta}T23:59:59.999`).toISOString() }),
  };
}

