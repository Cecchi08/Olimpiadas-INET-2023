export function normalizarEstadisticas(data) {
  return {
    ...data,
    por_area: (data.por_area || []).map(row => ({ nombre: row.nombre || row.area_nombre || row.area?.nombre || `Área #${row.area_id}`, cantidad: Number(row.cantidad ?? row.total_llamados ?? row.total ?? 0) })),
    por_tipo: (data.por_tipo || []).map(row => ({ nombre: row.tipo || row.nombre, cantidad: Number(row.cantidad ?? row.total_llamados ?? row.total ?? 0) })),
    por_dia: data.por_dia?.map(row => ({ fecha: row.fecha || row.dia, promedio: row.promedio ?? row.tiempo_promedio_respuesta_segundos ?? row.tiempo_promedio_respuesta_seg ?? null })),
  };
}
export function respuestaPorDia(llamados) {
  const groups = new Map();
  for (const call of llamados) {
    const seconds = call.tiempo_respuesta_segundos ?? call.tiempo_respuesta_seg;
    if (call.estado !== 'Atendido' || seconds == null || !Number.isFinite(Number(seconds))) continue;
    const date = new Date(call.fecha_hora_activacion || call.fecha_activacion);
    if (Number.isNaN(date.getTime())) continue;
    const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const group = groups.get(key) || { total: 0, count: 0 };
    group.total += Number(seconds); group.count++; groups.set(key, group);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([fecha, group]) => ({ fecha, promedio: Math.round(group.total / group.count * 10) / 10 }));
}

