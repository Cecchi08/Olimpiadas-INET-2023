import { dbResult } from '../utils/errors.js';
import { databaseColumns } from '../utils/queries.js';

export async function comprobarConexion(db) {
  // No se devuelven datos de pacientes ni información de cuentas.
  const columns = await databaseColumns(db, 'areas');
  dbResult(await db.from('areas').select(`id,${columns.coord_x},${columns.coord_y},ancho,alto`).limit(0));
  dbResult(await db.from('perfiles').select('id,email,rol').limit(1));
  return { status: 'ok', database: 'connected' };
}
