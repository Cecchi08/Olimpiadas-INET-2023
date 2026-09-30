import { readEnv } from '../src/config/env.js';
import { createSupabase } from '../src/config/supabase.js';
import { dbResult } from '../src/utils/errors.js';
import { databaseColumns } from '../src/utils/queries.js';

export async function checkBackend() {
  const env = readEnv();
  const { db } = createSupabase(env);
  for (const [table, columns] of [
    ['perfiles', 'id,email,rol,nombre,area_asignada_id,turno'],
    ['areas', 'id,nombre,tipo,coord_x,coord_y,ancho,alto'],
    ['camas', 'id,area_id,nombre,coord_x,coord_y'],
    ['pacientes', 'id,nombre,dni,datos_medicos,cama_id,area_id,enfermero_id'],
    ['llamados', 'id,paciente_id,area_id,origen,tipo,estado,fecha_activacion,fecha_atencion,tiempo_respuesta_seg,cama_id,enfermero_atencion_id,enfermero_destino_id,es_simulacion,atencion_automatica_en,atencion_automatica']
  ]) {
    const names = await databaseColumns(db, table);
    dbResult(await db.from(table).select(columns.split(',').map(name => names[name] || name).join(',')).limit(0));
    console.log(`OK tabla ${table}`);
  }
  dbResult(await db.rpc('estadisticas_llamados', {}));
  console.log('OK función de estadísticas');
  const users = dbResult(await db.from('perfiles').select('id,email,rol').eq('rol', 'Administrador').limit(1));
  if (!users.length) throw new Error('Falta un perfil Administrador. Seguir backend/README.md para crear el primer usuario.');
  console.log('OK perfil administrador disponible');
  return { env, profile: users[0] };
}

if (process.argv[1] && new URL(import.meta.url).pathname.endsWith('/' + process.argv[1].replaceAll('\\', '/').split('/').at(-1))) {
  checkBackend().catch(error => { console.error(error.message); process.exitCode = 1; });
}
