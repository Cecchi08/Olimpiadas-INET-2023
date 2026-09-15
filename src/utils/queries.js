import { AppError, dbResult } from './errors.js';

export const llamadoSelect = `*,paciente:pacientes(id,nombre,dni),area:areas(*),
  cama:camas(*),enfermero:perfiles!llamados_enfermero_atencion_id_fkey(id,email,rol)`;
export const pacienteSelect = '*,area:areas(*),cama:camas(*),enfermero:perfiles(id,email,rol)';

export function applyFilters(query, filters) {
  for (const key of ['area_id', 'origen', 'tipo', 'estado']) {
    if (filters[key] !== undefined) query = query.eq(key, filters[key]);
  }
  if (filters.fecha_desde) query = query.gte('fecha_activacion', filters.fecha_desde);
  if (filters.fecha_hasta) query = query.lte('fecha_activacion', filters.fecha_hasta);
  return query;
}

export async function paginate(query, filters) {
  const page = filters.page || 1;
  const limit = filters.limit || 100;
  const result = await query.order('id').range((page - 1) * limit, page * limit - 1);
  return { data: dbResult(result), total: result.count, page, limit };
}

export async function allLlamados(db, filters) {
  const latest = dbResult(await applyFilters(db.from('llamados').select('id'), filters)
    .order('id', { ascending: false }).limit(1));
  if (!latest.length) return [];
  const rows = [];
  let cursor = 0;
  while (true) {
    const batch = dbResult(await applyFilters(db.from('llamados').select(llamadoSelect), filters)
      .gt('id', cursor).lte('id', latest[0].id).order('id').limit(500));
    if (!batch.length) break;
    rows.push(...batch);
    if (rows.length > 100000) throw new AppError(413, 'Acotar las fechas del reporte a menos de 100000 llamados');
    cursor = batch.at(-1).id;
  }
  return rows;
}
