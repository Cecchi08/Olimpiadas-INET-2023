import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const adminId = '11111111-1111-4111-8111-111111111111';
const nurseId = '22222222-2222-4222-8222-222222222222';

test('SQL completo: integridad, permisos, llamados y estadísticas', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_app_meta_data jsonb,
      raw_user_meta_data jsonb);
  `);
  await db.exec(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
  const value = async (sql, params = []) => (await db.query(sql, params)).rows[0]?.value;
  await db.query(`insert into auth.users values ($1, 'admin@hospital.com', '{"rol":"Administrador"}', '{}'),
    ($2, 'enfermero@hospital.com', '{}', '{"rol":"Administrador"}')`, [adminId, nurseId]);

  await t.test('trigger transaccional y rol sin confiar en metadatos del usuario', async () => {
    assert.equal(await value('select rol as value from public.perfiles where id = $1', [adminId]), 'Administrador');
    assert.equal(await value('select rol as value from public.perfiles where id = $1', [nurseId]), 'Generico');
    await db.query("update auth.users set email = 'enfermeria@hospital.com' where id = $1", [nurseId]);
    assert.equal(await value('select email as value from public.perfiles where id = $1', [nurseId]), 'enfermeria@hospital.com');
  });
  await db.exec(`
    insert into public.areas(nombre,tipo,coord_x,coord_y) values
      ('Habitación 1','Habitacion',0,0), ('Baño 1','Bano',10,20), ('Habitación 2','Habitacion',30,40);
    insert into public.camas(area_id,nombre,coord_x,coord_y) values (1,'Cama 1',1,2);
    insert into public.pacientes(nombre,dni,cama_id,area_id) values ('Paciente A','12345678',1,1);
  `);
  await t.test('cama ocupada, cama de otra área y DNI repetido son rechazados', async () => {
    await assert.rejects(db.exec("insert into public.pacientes(nombre,dni,cama_id,area_id) values ('B','22345678',1,1)"), { code: '23505' });
    await assert.rejects(db.exec('update public.pacientes set area_id=3 where id=1'), { code: '23503' });
    await assert.rejects(db.exec("insert into public.pacientes(nombre,dni,area_id) values ('B','12345678',1)"), { code: '23505' });
  });
  await t.test('roles de cliente sin acceso a tablas ni RPC', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.exec('select * from public.pacientes'), { code: '42501' });
      await assert.rejects(db.exec('select public.estadisticas_llamados()'), { code: '42501' });
      await db.exec('reset role');
    }
    assert.equal(await value("select count(*)::int as value from pg_class where relname in ('perfiles','areas','camas','pacientes','llamados') and relrowsecurity"), 5);
  });
  await db.exec('set role service_role');
  let call;
  await t.test('crear llamado, validar origen y evitar activos duplicados', async () => {
    call = await value("select public.crear_llamado(1,1,'Cama','Emergencia') as value");
    assert.equal(call.estado, 'No Atendido');
    assert.equal(call.paciente.nombre, 'Paciente A');
    assert.equal(call.cama.id, 1);
    assert.equal(call.area.id, 1);
    await assert.rejects(db.exec("select public.crear_llamado(1,1,'Cama','Emergencia')"), { code: '23505' });
    await assert.rejects(db.exec("select public.crear_llamado(1,3,'Cama','Normal')"), { code: 'PT400' });
    await assert.rejects(db.exec("select public.crear_llamado(1,1,'Bano','Normal')"), { code: 'PT400' });
    await assert.rejects(db.exec("select public.crear_llamado(999,1,'Cama','Normal')"), { code: 'PT404' });
    const bathroom = await value("select public.crear_llamado(1,2,'Bano','Normal') as value");
    assert.equal(bathroom.cama, null);
  });
  await t.test('dos atenciones: una sola confirma y conserva al enfermero', async () => {
    await db.query("update public.llamados set fecha_activacion=clock_timestamp()-interval '12 seconds' where id=$1", [call.id]);
    const outcomes = await Promise.allSettled([
      value('select public.atender_llamado($1,$2) as value', [call.id, nurseId]),
      value('select public.atender_llamado($1,$2) as value', [call.id, adminId])
    ]);
    assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(outcomes.find(r => r.status === 'rejected').reason.code, 'PT409');
    const row = outcomes.find(r => r.status === 'fulfilled').value;
    assert.equal(row.enfermero.id, nurseId);
    assert.equal(row.estado, 'Atendido');
    assert.ok(row.tiempo_respuesta_seg >= 12);
    await assert.rejects(db.query('select public.atender_llamado(999,$1)', [nurseId]), { code: 'PT404' });
    await assert.rejects(db.exec('delete from public.pacientes where id=1'),
      error => ['23503', '23001'].includes(error.code));
  });
  await t.test('estadísticas completas con más de 1000 llamados y filtros', async () => {
    await db.query(`insert into public.llamados(paciente_id,area_id,origen,tipo,estado,
      fecha_activacion,fecha_atencion,tiempo_respuesta_seg,enfermero_atencion_id)
      select 1,2,'Bano','Normal','Atendido',now()-interval '10 seconds',now(),10,$1
      from generate_series(1,1201)`, [nurseId]);
    const stats = await value('select public.estadisticas_llamados() as value');
    assert.equal(stats.total_llamados, 1203);
    assert.equal(stats.atendidos, 1202);
    assert.equal(stats.no_atendidos, 1);
    assert.equal(stats.por_area.reduce((sum, g) => sum + g.total_llamados, 0), 1203);
    const active = await value("select public.estadisticas_llamados(p_estado=>'No Atendido') as value");
    assert.equal(active.total_llamados, 1);
    assert.equal(active.tiempo_promedio_respuesta_seg, null);
    assert.equal(active.por_area[0].tiempo_promedio_respuesta_seg, null);
    const none = await value("select public.estadisticas_llamados(p_fecha_hasta=>'2000-01-01Z') as value");
    assert.equal(none.total_llamados, 0);
    assert.deepEqual(none.por_area, []);
  });
});
