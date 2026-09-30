// Adaptación HTTP: conservamos las columnas históricas de PostgreSQL y
// exponemos también los nombres usados por el frontend.
export const aliasesColumnas = [
  ['coord_x', 'coordenadas_x'], ['coord_y', 'coordenadas_y'],
  ['enfermero_id', 'enfermero_asignado_id'],
  ['fecha_activacion', 'fecha_hora_activacion'],
  ['fecha_atencion', 'fecha_hora_atencion'],
  ['tiempo_respuesta_seg', 'tiempo_respuesta_segundos']
];

// Permite usar tanto el esquema histórico del repositorio como el desplegado.
export function normalizarRegistro(row) {
  if (!row || typeof row !== 'object') return row;
  const result = { ...row };
  for (const [stored, api] of aliasesColumnas) {
    if (!Object.hasOwn(row, stored) && Object.hasOwn(row, api)) result[stored] = row[api];
  }
  if (row.origen === 'Baño') result.origen = 'Bano';
  return result;
}

export function presentarRegistro(row) {
  if (!row || typeof row !== 'object') return row;
  const result = { ...row };
  for (const [stored, api] of aliasesColumnas) {
    if (Object.hasOwn(row, stored)) result[api] = row[stored];
  }
  if (row.origen === 'Bano') result.origen = 'Baño';
  for (const key of ['area', 'cama', 'paciente']) {
    if (row[key]) result[key] = presentarRegistro(row[key]);
  }
  return result;
}

export function presentarListado(result) {
  return { ...result, data: result.data.map(presentarRegistro) };
}
