import { AppError, dbResult } from './errors.js';
import { normalizarRegistro } from './contrato.js';

const contracts = new WeakMap();
const columnNames = {
  areas: { coord_x: 'coordenadas_x', coord_y: 'coordenadas_y' },
  camas: { coord_x: 'coordenadas_x', coord_y: 'coordenadas_y' },
  pacientes: { enfermero_id: 'enfermero_asignado_id' },
  llamados: { fecha_activacion: 'fecha_hora_activacion', fecha_atencion: 'fecha_hora_atencion',
    tiempo_respuesta_seg: 'tiempo_respuesta_segundos' }
};

// Detecta solo columnas, incluso con tablas vacías. Nunca requiere joins.
export async function databaseColumns(db, table) {
  if (!columnNames[table]) return {};
  if (!contracts.has(db)) contracts.set(db, new Map());
  const cache = contracts.get(db);
  if (!cache.has(table)) {
    const pending = (async () => {
      const names = columnNames[table];
      const result = await db.from(table).select(['id', ...Object.values(names)].join(',')).limit(0);
      if (!result.error) return names;
      if (!['42703', 'PGRST204'].includes(result.error.code)) dbResult(result);
      dbResult(await db.from(table).select(['id', ...Object.keys(names)].join(',')).limit(0));
      return Object.fromEntries(Object.keys(names).map(key => [key, key]));
    })();
    cache.set(table, pending);
    pending.catch(() => cache.delete(table));
  }
  return cache.get(table);
}

export async function prepareWrite(db, table, input) {
  const names = await databaseColumns(db, table);
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [names[key] || key, value]));
}

async function byIds(db, table, ids, select = '*') {
  const unique = [...new Set(ids.filter(id => id !== null && id !== undefined).map(String))];
  const result = new Map();
  // Limita la URL y pagina también si PostgREST tiene un max-rows pequeño.
  for (let offset = 0; offset < unique.length; offset += 100) {
    const chunk = unique.slice(offset, offset + 100);
    let cursor;
    let received = 0;
    while (true) {
      let query = db.from(table).select(select).in('id', chunk).order('id').limit(100);
      if (cursor !== undefined) query = query.gt('id', cursor);
      const rows = dbResult(await query);
      if (!rows.length) break;
      for (const row of rows) result.set(String(row.id), normalizarRegistro(row));
      received += rows.length;
      if (received === chunk.length) break;
      cursor = rows.at(-1).id;
    }
  }
  return result;
}

export async function hydrateRows(db, table, records) {
  const rows = records.map(normalizarRegistro);
  if (!rows.length || !['camas', 'pacientes', 'llamados'].includes(table)) return rows;
  const nurseKey = table === 'pacientes' ? 'enfermero_id' : 'enfermero_atencion_id';
  const [areas, camas, pacientes, perfiles] = await Promise.all([
    byIds(db, 'areas', rows.map(row => row.area_id)),
    byIds(db, 'camas', table === 'camas' ? [] : rows.map(row => row.cama_id)),
    byIds(db, 'pacientes', table === 'llamados' ? rows.map(row => row.paciente_id) : [], 'id,nombre,dni'),
    byIds(db, 'perfiles', table === 'camas' ? [] : rows.flatMap(row => [row[nurseKey], row.enfermero_destino_id]), '*')
  ]);
  const nurseAreas = table === 'llamados'
    ? await byIds(db, 'areas', [...perfiles.values()].map(profile => profile.area_asignada_id)) : new Map();
  return rows.map(row => ({
    ...row,
    area: areas.get(String(row.area_id)) ?? null,
    ...(table === 'camas' ? {} : {
      cama: camas.get(String(row.cama_id)) ?? null,
      enfermero: perfiles.get(String(row[nurseKey])) ?? null
    }),
    ...(table === 'llamados' ? {
      paciente: pacientes.get(String(row.paciente_id)) ?? null,
      enfermero_destino: perfiles.get(String(row.enfermero_destino_id)) ?? null,
      area_enfermero: nurseAreas.get(String(perfiles.get(String(row.enfermero_destino_id))?.area_asignada_id)) ?? null
    } : {})
  }));
}

export function applyFilters(query, filters, columns = {}) {
  for (const key of ['area_id', 'origen', 'tipo', 'estado']) {
    if (filters[key] === undefined) continue;
    const value = key === 'origen' && filters[key] === 'Bano'
      && columns.fecha_activacion === 'fecha_hora_activacion' ? 'Baño' : filters[key];
    query = query.eq(key, value);
  }
  const activation = columns.fecha_activacion || 'fecha_activacion';
  if (filters.fecha_desde) query = query.gte(activation, filters.fecha_desde);
  if (filters.fecha_hasta) query = query.lte(activation, filters.fecha_hasta);
  return query;
}

export async function paginate(query, filters) {
  const page = filters.page || 1;
  const limit = filters.limit || 100;
  const result = await query.order('id').range((page - 1) * limit, page * limit - 1);
  return { data: dbResult(result), total: result.count, page, limit };
}

export async function allLlamados(db, filters) {
  const columns = await databaseColumns(db, 'llamados');
  const latest = dbResult(await applyFilters(db.from('llamados').select('id'), filters, columns)
    .order('id', { ascending: false }).limit(1));
  if (!latest.length) return [];
  const rows = [];
  let cursor = 0;
  while (true) {
    const batch = dbResult(await applyFilters(db.from('llamados').select('*'), filters, columns)
      .gt('id', cursor).lte('id', latest[0].id).order('id').limit(500));
    if (!batch.length) break;
    rows.push(...batch);
    if (rows.length > 100000) throw new AppError(413, 'Acotar las fechas del reporte a menos de 100000 llamados');
    cursor = batch.at(-1).id;
  }
  return hydrateRows(db, 'llamados', rows);
}
