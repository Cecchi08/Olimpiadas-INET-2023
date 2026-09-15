import { AppError, dbResult } from '../utils/errors.js';
import { paginate, applyFilters, allLlamados, llamadoSelect, pacienteSelect } from '../utils/queries.js';
import { createCsv, createPdf } from '../utils/exports.js';

export function createControllers({ db, newAuthClient, auth, publish }) {
  function crud(table, select = '*') {
    return {
      list: async (req, res) => {
        let query = db.from(table).select(select, { count: 'exact' });
        const area = req.filters.area_id ?? req.filters.area;
        const nurse = req.filters.enfermero_id ?? req.filters.enfermero;
        if (area !== undefined) query = query.eq('area_id', area);
        if (nurse !== undefined) query = query.eq('enfermero_id', nurse);
        res.json(await paginate(query, req.filters));
      },
      get: async (req, res) => res.json(dbResult(await db.from(table)
        .select(select).eq('id', req.params.id).single())),
      create: async (req, res) => res.status(201).json(dbResult(await db.from(table)
        .insert(req.input).select(select).single())),
      update: async (req, res) => res.json(dbResult(await db.from(table)
        .update(req.input).eq('id', req.params.id).select(select).single())),
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
      const { email, password, rol } = req.input;
      const { data, error } = await db.auth.admin.createUser({
        email, password, email_confirm: true, app_metadata: { rol }
      });
      if (error) {
        if (['email_exists', 'user_already_exists'].includes(error.code)) {
          throw new AppError(409, 'El usuario ya existe');
        }
        throw new AppError(error.status >= 500 ? 503 : 400, 'No se pudo crear el usuario');
      }
      // El trigger crea el perfil en la misma transacción que auth.users.
      res.status(201).json(dbResult(await db.from('perfiles').select('id,email,rol')
        .eq('id', data.user.id).single()));
    },
    me: (req, res) => {
      const { id, email, rol } = req.user;
      res.json({ id, email, rol });
    }
  };
  const llamados = {
    create: async (req, res) => {
      const row = dbResult(await db.rpc('crear_llamado', {
        p_paciente_id: req.input.paciente_id, p_area_id: req.input.area_id,
        p_origen: req.input.origen, p_tipo: req.input.tipo
      }));
      const event = { ...row, timestamp: row.fecha_activacion };
      publish('nuevoLlamado', event);
      if (row.tipo === 'Emergencia') publish('codigoAzul', event);
      publish('logSistema', `Llamado #${row.id} activado (${row.tipo}).`);
      res.status(201).json(row);
    },
    attend: async (req, res) => {
      const row = dbResult(await db.rpc('atender_llamado', {
        p_id: Number(req.params.id), p_enfermero_id: req.user.id
      }));
      publish('llamadoAtendido', { id: row.id, tiempo_respuesta_seg: row.tiempo_respuesta_seg,
        enfermero: row.enfermero, fecha_atencion: row.fecha_atencion });
      publish('logSistema', `Llamado #${row.id} atendido en ${row.tiempo_respuesta_seg} segundos.`);
      res.json(row);
    },
    list: async (req, res) => res.json(await paginate(applyFilters(
      db.from('llamados').select(llamadoSelect, { count: 'exact' }), req.filters
    ), req.filters)),
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
  return { auth: authController, areas: crud('areas'), camas: crud('camas', '*,area:areas(*)'),
    pacientes: crud('pacientes', pacienteSelect), llamados, reportes };
}
