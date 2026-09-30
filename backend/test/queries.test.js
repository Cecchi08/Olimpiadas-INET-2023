import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { hydrateRows, databaseColumns, prepareWrite, allLlamados, applyFilters } from '../src/utils/queries.js';

function fixture({ legacy = false, cap = 2, failTable } = {}) {
  const requests = [];
  const tables = {
    areas: [{ id: 1, nombre: 'Habitación', coordenadas_x: 10, coordenadas_y: 20 }],
    camas: [{ id: 2, area_id: 1, nombre: 'Cama A' }],
    perfiles: [{ id: 'nurse', email: 'enfermero@example.com', rol: 'Generico' }],
    pacientes: [{ id: 3, nombre: 'Paciente', dni: '12345678', area_id: 1, cama_id: 2, enfermero_asignado_id: 'nurse' }],
    llamados: Array.from({ length: 7 }, (_, i) => ({
      id: i + 1, paciente_id: 3, area_id: 1, origen: 'Baño', tipo: 'Normal',
      estado: 'Atendido', fecha_hora_activacion: '2026-09-30T00:00:00Z',
      tiempo_respuesta_segundos: 15
    }))
  };
  const db = createClient('https://test.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => {
      const url = new URL(input);
      const table = url.pathname.split('/').at(-1);
      const select = url.searchParams.get('select');
      requests.push({ table, select, params: url.searchParams });
      assert.ok(!/[():!]/.test(select), `No debe usar embeddings: ${select}`);
      if (table === failTable) return Response.json({ code: '42501' }, { status: 403 });
      if (legacy && /coordenadas_x|enfermero_asignado_id|fecha_hora_activacion/.test(select)) {
        return Response.json({ code: '42703' }, { status: 400 });
      }
      let rows = [...tables[table]];
      for (const [key, value] of url.searchParams) {
        if (value.startsWith('in.(')) {
          const ids = value.slice(4, -1).split(',').map(value => value.replaceAll('"', ''));
          rows = rows.filter(row => ids.includes(String(row[key])));
        } else if (value.startsWith('eq.')) rows = rows.filter(row => String(row[key]) === value.slice(3));
        else if (value.startsWith('gt.')) rows = rows.filter(row => row[key] > value.slice(3));
        else if (value.startsWith('gte.')) rows = rows.filter(row => row[key] >= value.slice(4));
        else if (value.startsWith('lte.')) rows = rows.filter(row => row[key] <= value.slice(4));
      }
      if (url.searchParams.get('order') === 'id.desc') rows.reverse();
      const limit = Number(url.searchParams.get('limit') ?? 100);
      rows = rows.slice(0, Math.min(cap, limit));
      if (select !== '*') rows = rows.map(row => Object.fromEntries(
        select.split(',').filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]])
      ));
      return Response.json(rows);
    } }
  });
  return { db, requests, tables };
}

test('consultas separadas conservan objetos, orden y relaciones nulas', async () => {
  const { db, tables, requests } = fixture();
  const rows = await hydrateRows(db, 'pacientes', [tables.pacientes[0], {
    id: 4, nombre: 'Sin asignación', area_id: 999, cama_id: null, enfermero_asignado_id: null
  }]);
  assert.equal(rows[0].area.coord_x, 10);
  assert.equal(rows[0].cama.nombre, 'Cama A');
  assert.equal(rows[0].enfermero.email, 'enfermero@example.com');
  assert.equal(rows[1].area, null);
  assert.equal(rows[1].cama, null);
  assert.equal(rows[1].enfermero, null);
  assert.deepEqual(rows.map(row => row.id), [3, 4]);
  assert.ok(requests.length <= 4);
});

test('llamados sin FK directa no inventan cama histórica ni enfermero de atención', async () => {
  const { db, tables } = fixture();
  const rows = await hydrateRows(db, 'llamados', tables.llamados.slice(0, 1));
  assert.deepEqual(rows[0].paciente, { id: 3, nombre: 'Paciente', dni: '12345678' });
  assert.equal(rows[0].area.id, 1);
  assert.equal(rows[0].cama, null);
  assert.equal(rows[0].enfermero, null);
  const historical = await hydrateRows(db, 'llamados', [{ ...tables.llamados[0], cama_id: 2, enfermero_atencion_id: 'nurse' }]);
  assert.equal(historical[0].cama.id, 2);
  assert.equal(historical[0].enfermero.id, 'nurse');
});

test('batchea relaciones, soporta cap de PostgREST y evita N+1', async () => {
  const { db, tables, requests } = fixture();
  tables.areas = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, nombre: `Área ${i + 1}` }));
  const rows = Array.from({ length: 500 }, (_, i) => ({ id: i + 1, area_id: (i % 5) + 1 }));
  const result = await hydrateRows(db, 'camas', rows);
  assert.ok(result.every(row => row.area?.id === row.area_id));
  assert.equal(requests.length, 3);
});

test('adapta columnas, filtros, escrituras y null en ambos esquemas; cachea detección', async () => {
  const { db, requests } = fixture();
  const writes = await prepareWrite(db, 'pacientes', { nombre: 'Paciente', enfermero_id: null });
  assert.deepEqual(writes, { nombre: 'Paciente', enfermero_asignado_id: null });
  await prepareWrite(db, 'pacientes', { enfermero_id: 'nurse' });
  assert.equal(requests.length, 1);
  const columns = await databaseColumns(db, 'llamados');
  const result = await applyFilters(db.from('llamados').select('id'), {
    origen: 'Bano', fecha_desde: '2026-09-01T00:00:00Z', fecha_hasta: '2026-10-01T00:00:00Z'
  }, columns);
  assert.equal(result.error, null);
  assert.equal(requests.at(-1).params.get('origen'), 'eq.Baño');
  assert.equal(requests.at(-1).params.get('fecha_hora_activacion'), 'gte.2026-09-01T00:00:00Z');
  assert.deepEqual(requests.at(-1).params.getAll('fecha_hora_activacion'), [
    'gte.2026-09-01T00:00:00Z', 'lte.2026-10-01T00:00:00Z'
  ]);
  const old = fixture({ legacy: true });
  assert.deepEqual(await prepareWrite(old.db, 'pacientes', { enfermero_id: null }), { enfermero_id: null });
  assert.equal(old.requests.length, 2);
});

test('exporta todas las páginas con fechas reales y objetos anidados', async () => {
  const { db } = fixture();
  const rows = await allLlamados(db, { origen: 'Bano' });
  assert.equal(rows.length, 7);
  assert.ok(rows.every(row => row.area.nombre === 'Habitación' && row.paciente.nombre === 'Paciente'));
  assert.ok(rows.every(row => row.fecha_activacion === '2026-09-30T00:00:00Z' && row.tiempo_respuesta_seg === 15));
});

test('los errores de relaciones no se ocultan como null', async () => {
  const { db } = fixture({ failTable: 'areas' });
  await assert.rejects(hydrateRows(db, 'camas', [{ id: 2, area_id: 1 }]), { status: 503 });
});
