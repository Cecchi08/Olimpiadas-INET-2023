import { AppError, dbResult } from '../utils/errors.js';
import { paginate, applyFilters, allLlamados, hydrateRows, databaseColumns, prepareWrite } from '../utils/queries.js';
import { createCsv, createPdf } from '../utils/exports.js';
import { presentarRegistro, presentarListado } from '../utils/contrato.js';
import { createSimulationService } from '../services/simulacion.js';
import { createPersonalControllers } from './personal.js';

export function createControllers({ db, newAuthClient, auth, publish }) {
  const simulation = createSimulationService({ db, publish });
  const personal = createPersonalControllers(db);
  function crud(table, select = '*') {
    const present = async row => presentarRegistro((await hydrateRows(db, table, [row]))[0]);
    return {
      list: async (req, res) => {
        let query = db.from(table).select(select, { count: 'exact' });
        const area = req.filters.area_id ?? req.filters.area;
        const nurse = req.filters.enfermero_asignado_id ?? req.filters.enfermero_id ?? req.filters.enfermero;
        if (area !== undefined) query = query.eq('area_id', area);
        if (nurse !== undefined) {
          const columns = await databaseColumns(db, table);
          query = query.eq(columns.enfermero_id || 'enfermero_id', nurse);
        }
        const result = await paginate(query, req.filters);
        result.data = await hydrateRows(db, table, result.data);
        res.json(presentarListado(result));
      },
      get: async (req, res) => res.json(await present(dbResult(await db.from(table)
        .select(select).eq('id', req.params.id).single()))),
      create: async (req, res) => {
        const input = await prepareWrite(db, table, req.input);
        const row = dbResult(await db.from(table).insert(input).select(select).single());
        res.status(201).json(await present(row));
      },
      update: async (req, res) => {
        const input = await prepareWrite(db, table, req.input);
        const row = dbResult(await db.from(table).update(input).eq('id', req.params.id).select(select).single());
        res.json(await present(row));
      },
      remove: async (req, res) => {
        dbResult(await db.from(table).delete().eq('id', req.params.id).select('id').single());
        res.status(204).end();
      }
    };
  }
  const authController = {
    login: async (req, res) => {
      // Cliente aislado: el login no modifica la sesión del cliente privilegiado.
      const { data, error } = await newAuthClient().auth.signInWithPassword(req.input);
      if (error) {
        if (error.status === 429) throw new AppError(429, 'Demasiados intentos');
        if (error.status >= 500 || !error.status) throw new AppError(503, 'Autenticación no disponible');
        throw new AppError(401, 'Credenciales inválidas');
      }
      const profile = dbResult(await db.from('perfiles').select('id,email,rol')
        .eq('id', data.user.id).maybeSingle());
      if (!profile) throw new AppError(403, 'El usuario no tiene perfil habilitado');
      res.json({ token: auth.sign(profile), token_type: 'Bearer', expires_in: 3600,
        rol: profile.rol, usuario: profile });
    },
    register: async (req, res) => {
      const { email, password, rol, nombre = '', area_asignada_id = null, turno = null } = req.input;
      const { data, error } = await db.auth.admin.createUser({
        email, password, email_confirm: true, app_metadata: { rol }
      });
      if (error) {
        if (['email_exists', 'user_already_exists'].includes(error.code)) {
          throw new AppError(409, 'El usuario ya existe');
        }
        throw new AppError(error.status >= 500 ? 503 : 400, 'No se pudo crear el usuario');
      }
      try {
        const profile = dbResult(await db.from('perfiles').upsert({
          id: data.user.id, email: data.user.email || email, rol, nombre, area_asignada_id, turno
        }, { onConflict: 'id' }).select('*').single());
        res.status(201).json(profile);
      } catch (failure) {
        const rollback = await db.auth.admin.deleteUser(data.user.id);
        if (rollback.error) console.error('No se pudo revertir el alta de Auth', { id: data.user.id });
        throw failure;
      }
    },
    me: (req, res) => {
      const { id, email, rol } = req.user;
      res.json({ id, email, rol });
    }
  };
  const llamados = {
    create: async (req, res) => {
      res.status(201).json(await simulation.create(req.input, req.user, req.input.simulacion === true));
    },
    simulate: async (req, res) => res.status(201).json(await simulation.create(req.input, req.user, true)),
    attend: async (req, res) => {
      res.json(await simulation.attend(req.params.id, req.user.id));
    },
    list: async (req, res) => {
      const columns = await databaseColumns(db, 'llamados');
      const result = await paginate(applyFilters(
        db.from('llamados').select('*', { count: 'exact' }), req.filters, columns
      ), req.filters);
      result.data = await hydrateRows(db, 'llamados', result.data);
      res.json(presentarListado(result));
    },
    active: async (req, res) => {
      req.filters.estado = 'No Atendido';
      return llamados.list(req, res);
    }
  };
  const reportes = {
    stats: async (req, res) => {
      const params = Object.fromEntries(['area_id', 'origen', 'tipo', 'estado', 'fecha_desde', 'fecha_hasta']
        .map(key => [`p_${key}`, req.filters[key] ?? null]));
      res.json(dbResult(await db.rpc('estadisticas_llamados', params)));
    },
    csv: async (req, res) => {
      const rows = await allLlamados(db, req.filters);
      res.attachment('llamados.csv').type('text/csv; charset=utf-8').send(createCsv(rows));
    },
    pdf: async (req, res) => {
      const rows = await allLlamados(db, req.filters);
      const pdf = await createPdf(rows);
      res.attachment('llamados.pdf').type('application/pdf').send(pdf);
    }
  };
  return { auth: authController, usuarios: { ...crud('perfiles'), update: personal.update, remove: personal.remove },
    enfermeros: personal.enfermeros, simulation, areas: crud('areas'), camas: crud('camas'),
    pacientes: crud('pacientes'), llamados, reportes };
}
