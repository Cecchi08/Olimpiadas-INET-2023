import { AppError, dbResult } from '../utils/errors.js';
import { databaseColumns } from '../utils/queries.js';

async function readAll(db, table, select, filter = query => query) {
  const rows = [];
  let cursor;
  while (true) {
    let query = filter(db.from(table).select(select)).order('id').limit(500);
    if (cursor !== undefined) query = query.gt('id', cursor);
    const batch = dbResult(await query);
    if (!batch.length) return rows;
    rows.push(...batch); cursor = batch.at(-1).id;
  }
}

export function createPersonalControllers(db) {
  return {
    enfermeros: async (req, res) => {
      const columns = await databaseColumns(db, 'pacientes');
      const [nurses, patients, areas] = await Promise.all([
        readAll(db, 'perfiles', '*', query => query.eq('rol', 'Generico')),
        readAll(db, 'pacientes', `id,${columns.enfermero_id}`), readAll(db, 'areas', '*')
      ]);
      const counts = new Map();
      for (const patient of patients) {
        const id = patient[columns.enfermero_id]; counts.set(id, (counts.get(id) || 0) + 1);
      }
      let rows = nurses.map(nurse => ({ ...nurse, pacientes_asignados: counts.get(nurse.id) || 0,
        area: areas.find(area => area.id === nurse.area_asignada_id) ?? null }));
      if (req.filters.area_id) rows = rows.filter(row => row.area_asignada_id === req.filters.area_id);
      const page = req.filters.page || 1; const limit = req.filters.limit || 100;
      res.json({ data: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit });
    },
    update: async (req, res) => {
      if (req.params.id === req.user.id && req.input.rol && req.input.rol !== 'Administrador') {
        throw new AppError(409, 'No podés quitarte tu propio acceso administrador');
      }
      const row = dbResult(await db.from('perfiles').update(req.input).eq('id', req.params.id).select('*').single());
      res.json(row);
    },
    remove: async (req, res) => {
      if (req.params.id === req.user.id) throw new AppError(409, 'No podés eliminar tu propia cuenta');
      const { error } = await db.auth.admin.deleteUser(req.params.id);
      if (error) throw new AppError(error.status === 404 ? 404 : 409,
        error.status === 404 ? 'Usuario no encontrado' : 'No se pudo eliminar el usuario. Revisar asignaciones e historial.');
      res.status(204).end();
    }
  };
}
