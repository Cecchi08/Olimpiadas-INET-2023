import { dbResult } from '../utils/errors.js';

export async function comprobarConexion(db) {
  // No se devuelven datos de pacientes ni información de cuentas.
  dbResult(await db.from('areas').select('id,coord_x,coord_y,ancho,alto').limit(1));
  dbResult(await db.from('perfiles').select('id,email,rol').limit(1));
  return { status: 'ok', database: 'connected' };
}

