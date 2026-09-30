import { readEnv } from '../src/config/env.js';
import { createSupabase } from '../src/config/supabase.js';

const { db } = createSupabase(readEnv());
const probes = [
  ['pacientes', 'id,enfermero_id'],
  ['pacientes', 'id,enfermero_asignado_id'],
  ['llamados', 'id,fecha_activacion,cama_id,enfermero_atencion_id'],
  ['llamados', 'id,fecha_hora_activacion,tiempo_respuesta_segundos'],
  ['pacientes', 'id,enfermero:perfiles(id,email,rol)'],
  ['pacientes', 'id,area:areas(id),cama:camas(id)'],
  ['llamados', 'id,paciente:pacientes(id),area:areas(id)'],
  ['llamados', 'id,cama:camas(id)'],
  ['llamados', 'id,enfermero:perfiles!llamados_enfermero_atencion_id_fkey(id)'],
  ['camas', 'id,area:areas(id)']
];

// limit(0) valida columnas y relaciones sin descargar registros clínicos.
for (const [table, select] of probes) {
  const { error, status } = await db.from(table).select(select).limit(0);
  console.log(JSON.stringify({
    table, select, status, ok: !error,
    ...(error ? { error: /^PGRST\d+$|^\d{2}[A-Z0-9]{3}$/.test(error.code || '')
      ? { code: error.code, message: error.message, details: error.details, hint: error.hint }
      : { code: error.code || 'NETWORK_ERROR', message: 'No se pudo completar la consulta' } } : {})
  }));
}
