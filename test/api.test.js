import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { io as connect } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { configureSockets } from '../src/sockets/index.js';
import { allLlamados } from '../src/utils/queries.js';
import { createCsv, createPdf } from '../src/utils/exports.js';
import { dbResult } from '../src/utils/errors.js';

const admin = { id: '11111111-1111-4111-8111-111111111111', email: 'admin@hospital.com', rol: 'Administrador' };
const nurse = { id: '22222222-2222-4222-8222-222222222222', email: 'nurse@hospital.com', rol: 'Generico' };
const env = { jwtSecret: 'test-secret-with-more-than-32-characters', origins: ['http://localhost:5173'], trustProxy: 0 };

function fixture() {
  const state = { profiles: [admin, nurse], calls: [], mutations: [], events: [] };
  const db = {
    from(table) {
      let rows = table === 'perfiles' ? state.profiles : table === 'llamados' ? state.calls : [];
      let single = false;
      let count = false;
      const query = {
        select(columns, options) { count = options?.count === 'exact'; return this; },
        eq(key, value) { rows = rows.filter(row => String(row[key]) === String(value)); return this; },
        gt(key, value) { rows = rows.filter(row => row[key] > value); return this; },
        lte(key, value) { rows = rows.filter(row => row[key] <= value); return this; },
        gte(key, value) { rows = rows.filter(row => row[key] >= value); return this; },
        order(key, options) { rows = [...rows].sort((a,b) => (a[key] - b[key]) * (options?.ascending === false ? -1 : 1)); return this; },
        limit(value) { rows = rows.slice(0, Math.min(value, 2)); return this; },
        range(start, end) { rows = rows.slice(start, end + 1); return this; },
        maybeSingle() { single = true; return this; },
        single() { single = true; return this; },
        insert(input) { state.mutations.push({ table, input }); rows = [{ id: 1, ...input }]; return this; },
        update(input) { state.mutations.push({ table, input }); rows = [{ id: 1, ...input }]; return this; },
        delete() { rows = [{ id: 1 }]; return this; },
        then(resolve, reject) { return Promise.resolve({ data: single ? rows[0] ?? null : rows,
          error: null, count: count ? rows.length : null }).then(resolve, reject); }
      };
      return query;
    },
    async rpc(name, args) {
      if (name === 'crear_llamado') {
        const row = { id: 1, tipo: args.p_tipo, origen: args.p_origen, estado: 'No Atendido',
          fecha_activacion: new Date().toISOString(), paciente: { id: 1, nombre: 'Paciente' },
          area: { id: 1, nombre: 'Habitación' }, cama: { id: 1, nombre: 'Cama' } };
        state.calls.push(row);
        return { data: row, error: null };
      }
      if (name === 'atender_llamado') {
        const row = state.calls.find(row => row.id === args.p_id);
        if (!row) return { error: { code: 'PT404', message: 'Llamado no encontrado' } };
        if (row.estado === 'Atendido') return { error: { code: 'PT409', message: 'El llamado ya fue atendido' } };
        Object.assign(row, { estado: 'Atendido', tiempo_respuesta_seg: 15,
          fecha_atencion: new Date().toISOString(), enfermero: state.profiles.find(p => p.id === args.p_enfermero_id) });
        return { data: row, error: null };
      }
      return { data: { total_llamados: state.calls.length }, error: null };
    },
    auth: { admin: { async createUser(input) {
      const profile = { id: '33333333-3333-4333-8333-333333333333', email: input.email, rol: input.app_metadata.rol };
      state.profiles.push(profile);
      return { data: { user: profile }, error: null };
    } } }
  };
  const newAuthClient = () => ({ auth: { signInWithPassword: async input => input.password === 'valid-password'
    ? { data: { user: admin }, error: null }
    : { error: { status: 400, code: 'invalid_credentials' } } } });
  const result = createApp({ env, db, newAuthClient,
    publish: (event, payload) => state.events.push({ event, payload: structuredClone(payload) }) });
  return { ...result, db, state };
}

test('HTTP: autenticación, permisos y validaciones', async () => {
  const { app, auth, state } = fixture();
  const adminToken = auth.sign(admin);
  const nurseToken = auth.sign(nurse);
  await request(app).get('/health').expect(200);
  await request(app).get('/api/pacientes').expect(401);
  await request(app).get('/api/auth/me').set('Authorization', 'Bearer fake').expect(401);
  await request(app).get('/health').set('Origin', 'https://intruso.example').expect(403);
  const login = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'valid-password' }).expect(200);
  assert.equal(login.body.rol, 'Administrador');
  await request(app).post('/api/auth/login').send({ email: admin.email, password: 'incorrecta' }).expect(401);
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`).expect(200);
  for (const path of ['/auth/register', '/areas', '/camas', '/pacientes']) {
    await request(app).post(`/api${path}`).set('Authorization', `Bearer ${nurseToken}`).send({}).expect(403);
  }
  await request(app).post('/api/auth/register').set('Authorization', `Bearer ${adminToken}`)
    .send({ email: 'new@hospital.com', password: 'long-password-123', rol: 'Generico' }).expect(201);
  await request(app).post('/api/areas').set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Área', tipo: 'Habitacion', coord_x: 'infinito', coord_y: 0 }).expect(400);
  await request(app).put('/api/pacientes/1').set('Authorization', `Bearer ${nurseToken}`)
    .send({ cama_id: null, enfermero_id: null, rol: 'Administrador' }).expect(200);
  assert.deepEqual(state.mutations.at(-1).input, { cama_id: null, enfermero_id: null });
  await request(app).put('/api/pacientes/1').set('Authorization', `Bearer ${nurseToken}`).send({}).expect(400);
  await request(app).get('/api/llamados?fecha_desde=2026-09-15').set('Authorization', `Bearer ${nurseToken}`).expect(400);
  await request(app).get('/api/llamados?fecha_desde=2026-09-15T00:00:00Z&fecha_hasta=2026-09-14T00:00:00Z')
    .set('Authorization', `Bearer ${nurseToken}`).expect(400);
  const expired = jwt.sign({}, env.jwtSecret, { subject: admin.id, issuer: 'codigo-azul', audience: 'hospital', expiresIn: -1 });
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`).expect(401);
  state.profiles = state.profiles.map(p => p.id === admin.id ? { ...p, rol: 'Generico' } : p);
  await request(app).post('/api/areas').set('Authorization', `Bearer ${adminToken}`).send({}).expect(403);
});

test('HTTP: flujo de emergencia y eventos después de guardar', async () => {
  const { app, auth, state } = fixture();
  const token = auth.sign(nurse);
  const header = { Authorization: `Bearer ${token}` };
  await request(app).post('/api/llamados/crear').set(header)
    .send({ paciente_id: 1, area_id: 1, origen: 'Cama', tipo: 'Emergencia' }).expect(201);
  assert.deepEqual(state.events.map(e => e.event), ['nuevoLlamado', 'codigoAzul', 'logSistema']);
  assert.ok(state.events[0].payload.timestamp);
  await request(app).put('/api/llamados/1/atender').set(header).send({ enfermero_id: admin.id }).expect(200);
  assert.equal(state.events.find(e => e.event === 'llamadoAtendido').payload.enfermero.id, nurse.id);
  await request(app).put('/api/llamados/1/atender').set(header).expect(409);
  assert.equal(state.events.filter(e => e.event === 'llamadoAtendido').length, 1);
  const active = await request(app).get('/api/llamados/activos').set(header).expect(200);
  assert.equal(active.body.data.length, 0);
  await request(app).get('/api/reportes/export/csv').set(header).expect(200).expect('Content-Type', /text\/csv/);
  await request(app).get('/api/reportes/export/pdf').set(header).expect(200).expect('Content-Type', /application\/pdf/);
});

test('exportaciones sin truncamiento, CSV seguro y PDF vacío válido', async () => {
  const { db, state } = fixture();
  state.calls = Array.from({ length: 7 }, (_, i) => ({ id: i + 1 }));
  assert.equal((await allLlamados(db, {})).length, 7);
  const csv = createCsv([{ id: 1, paciente: { nombre: '=HYPERLINK("https://example.com")' }, tiempo_respuesta_seg: 0 }]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(createCsv([]).includes('fecha_activacion'));
  assert.equal((await createPdf([])).subarray(0, 5).toString(), '%PDF-');
  for (const code of ['23503', '23001']) {
    assert.throws(() => dbResult({ error: { code } }), { status: 409 });
  }
});

test('HTTP: CRUD, filtros y llamado normal', async () => {
  const { app, auth, state } = fixture();
  const header = { Authorization: `Bearer ${auth.sign(admin)}` };
  for (const [resource, body] of [
    ['areas', { nombre: 'Habitación', tipo: 'Habitacion', coord_x: 0, coord_y: 1 }],
    ['camas', { nombre: 'Cama', area_id: 1, coord_x: 0, coord_y: 1 }],
    ['pacientes', { nombre: 'Paciente', dni: '12345678', area_id: 1 }]
  ]) {
    await request(app).get(`/api/${resource}?page=1&limit=10`).set(header).expect(200);
    await request(app).post(`/api/${resource}`).set(header).send(body).expect(201);
    await request(app).put(`/api/${resource}/1`).set(header).send({ nombre: 'Otro' }).expect(200);
    await request(app).delete(`/api/${resource}/1`).set(header).expect(204);
  }
  await request(app).get('/api/pacientes?area=1&enfermero=' + nurse.id).set(header).expect(200);
  await request(app).post('/api/llamados/crear').set(header)
    .send({ paciente_id: 1, area_id: 1, origen: 'Cama', tipo: 'Normal' }).expect(201);
  assert.ok(!state.events.some(e => e.event === 'codigoAzul'));
  const response = await request(app).get('/api/llamados?tipo=Normal&estado=No%20Atendido')
    .set(header).expect(200);
  assert.equal(response.body.data.length, 1);
  await request(app).get('/api/reportes/estadisticas').set(header).expect(200);
});

test('Socket.IO: rechaza anónimos y autoriza room hospital', { timeout: 10000 }, async t => {
  const { app, auth } = fixture();
  const server = createServer(app);
  const io = configureSockets(server, env, auth);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => io.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const anonymous = connect(url, { reconnection: false });
  t.after(() => anonymous.close());
  const [error] = await once(anonymous, 'connect_error');
  assert.equal(error.message, 'No autorizado');
  const client = connect(url, { auth: { token: auth.sign(nurse) }, reconnection: false });
  t.after(() => client.close());
  await once(client, 'connect');
  assert.equal(io.sockets.adapter.rooms.get('hospital').size, 1);
  const event = once(client, 'codigoAzul');
  io.to('hospital').emit('codigoAzul', { id: 42 });
  assert.equal((await event)[0].id, 42);
});
