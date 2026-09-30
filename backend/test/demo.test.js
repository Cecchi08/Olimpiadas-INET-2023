import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createSimulationService } from '../src/services/simulacion.js';

const nurse = '22222222-2222-4222-8222-222222222222';
const admin = '11111111-1111-4111-8111-111111111111';
const migration = await readFile(new URL('../supabase/migrations/20260930140537_demo_codigo_azul.sql', import.meta.url), 'utf8');

for (const historical of [false, true]) {
  test(`SQL demo sobre esquema ${historical ? 'histórico' : 'desplegado'}: migración y ciclo completo`, async t => {
    const db = new PGlite(); t.after(() => db.close());
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb);`);
    if (historical) await db.exec(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
    else await db.exec(`
      create table public.perfiles(id uuid primary key references auth.users(id) on delete cascade,email text unique,rol text);
      create table public.areas(id serial primary key,nombre text,tipo text,coordenadas_x float,coordenadas_y float,ancho float,alto float);
      create table public.camas(id serial primary key,area_id int references areas(id),nombre text,coordenadas_x float,coordenadas_y float);
      create table public.pacientes(id serial primary key,nombre text,dni text unique,datos_medicos text,cama_id int references camas(id),area_id int references areas(id),enfermero_asignado_id uuid references perfiles(id));
      create table public.llamados(id serial primary key,paciente_id int references pacientes(id),area_id int references areas(id),
        origen text check(origen in ('Cama','Baño')),tipo text,estado text,fecha_hora_activacion timestamptz,
        fecha_hora_atencion timestamptz,tiempo_respuesta_segundos int);
    `);
    await db.exec(migration);
    await db.exec(migration);
    await db.query(`insert into auth.users values ($1,'admin@demo.test','{"rol":"Administrador"}'),($2,'nurse@demo.test','{}')`, [admin,nurse]);
    if (!historical) await db.query(`insert into perfiles(id,email,rol) values($1,'admin@demo.test','Administrador'),($2,'nurse@demo.test','Generico')`, [admin,nurse]);
    await db.exec(`insert into areas(nombre,tipo,coordenadas_x,coordenadas_y,ancho,alto) values
      ('Habitación','Habitacion',55,56,20,18),('Baño','Bano',8,84,10,10),('Enfermería','Enfermeria',82,17,20,18);
      insert into camas(area_id,nombre,coordenadas_x,coordenadas_y) values(1,'Cama 1',55,56);`);
    await db.query(`update perfiles set nombre='Enfermera Demo',area_asignada_id=3,turno='Noche' where id=$1;
    `,[nurse]);
    await db.query(`insert into pacientes(nombre,dni,cama_id,area_id,enfermero_asignado_id) values('Paciente Demo','12345678',1,1,$1)`,[nurse]);
    await db.exec('set role service_role');
    const rpc = async (sql,args=[]) => (await db.query(sql,args)).rows[0].value;
    const call = await rpc("select crear_llamado(1,1,'Cama','Emergencia',true,$1) as value",[admin]);
    assert.equal(call.es_simulacion,true);
    assert.equal(call.cama.id,1);
    assert.equal(call.enfermero_destino.id,nurse);
    assert.equal(call.area_enfermero.nombre,'Enfermería');
    const due = Date.parse(call.atencion_automatica_en)-Date.parse(call.fecha_hora_activacion);
    assert.ok(due >= 29990 && due <= 30100);
    await assert.rejects(rpc("select crear_llamado(1,1,'Cama','Emergencia',true,$1) as value",[admin]),{code:'PT409'});
    await assert.rejects(rpc('select atender_llamado($1,$2,true) as value',[call.id,nurse]),{code:'PT400'});
    await db.query("update llamados set atencion_automatica_en=clock_timestamp()-interval '1 second' where id=$1",[call.id]);
    const attempts = await Promise.allSettled([
      rpc('select atender_llamado($1,$2,true) as value',[call.id,nurse]),
      rpc('select atender_llamado($1,$2,false) as value',[call.id,admin])
    ]);
    assert.equal(attempts.filter(row=>row.status==='fulfilled').length,1);
    assert.equal(attempts.find(row=>row.status==='rejected').reason.code,'PT409');
    const attended = attempts.find(row=>row.status==='fulfilled').value;
    assert.equal(attended.enfermero.id,nurse);
    assert.equal(attended.atencion_automatica,true);
    const bathroom = await rpc("select crear_llamado(1,2,'Bano','Normal',true,$1) as value",[admin]);
    assert.equal(bathroom.origen,'Baño'); assert.equal(bathroom.cama,null);
    await rpc('select atender_llamado($1,$2,false) as value',[bathroom.id,nurse]);
    const ordinary = await rpc("select crear_llamado(1,1,'Cama','Normal',false,$1) as value",[admin]);
    assert.equal(ordinary.atencion_automatica_en,null);
    await assert.rejects(rpc('select atender_llamado($1,$2,true) as value',[ordinary.id,nurse]),{code:'PT400'});
    const stats = await rpc('select estadisticas_llamados() as value');
    assert.equal(stats.total_llamados,3); assert.equal(stats.atendidos,2); assert.equal(stats.no_atendidos,1);
    await db.exec('reset role; set role anon');
    await assert.rejects(rpc('select llamado_detalle(1) as value'), {code:'42501'});
  });
}

test('servicio demo: eventos completos, notificación privada, cancelación y recuperación', async () => {
  const tasks = new Map(); let nextId=0; const events=[]; const calls=[]; let row;
  const db = {
    async rpc(name,args) {
      calls.push({name,args});
      if(name==='crear_llamado') {
        row={id:1,estado:'No Atendido',es_simulacion:args.p_simulacion,paciente:{nombre:'Paciente'},area:{nombre:'Habitación'},tipo:args.p_tipo,
          fecha_hora_activacion:new Date().toISOString(),enfermero_destino_id:nurse,
          atencion_automatica_en:new Date(Date.now()+30000).toISOString()};
        return {data:{...row},error:null};
      }
      if(row.estado==='Atendido') return {error:{code:'PT409',message:'Ya atendido'}};
      row.estado='Atendido';
      return {data:{...row,enfermero:{id:args.p_enfermero_id},tiempo_respuesta_segundos:30},error:null};
    },
    from() {
      let cursor=0;
      return {select(){return this;},eq(){return this;},gt(k,v){cursor=v;return this;},order(){return this;},limit(){return this;},
        then(resolve){return Promise.resolve({data:row.estado==='No Atendido' && cursor===0?[row]:[],error:null}).then(resolve);}};
    }
  };
  const service=createSimulationService({db,publish:(...event)=>events.push(event),
    setTimer:(fn,delay)=>{const id=++nextId;tasks.set(id,{fn,delay});return id;},clearTimer:id=>tasks.delete(id)});
  await service.create({paciente_id:1,area_id:1,origen:'Cama',tipo:'Emergencia'},{id:admin},true);
  assert.deepEqual(events.slice(0,2).map(e=>e[0]),['nuevoLlamado','codigoAzul']);
  assert.equal(events[0][1].llamado_id,1);
  const notification=[...tasks.values()].find(task=>task.delay===1000);
  notification.fn(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(events.at(-1)[2],`usuario:${nurse}`);
  assert.ok([...tasks.values()].some(task=>task.delay>29000));
  await service.attend(1,admin); assert.equal(tasks.size,0);
  assert.equal(events.filter(event=>event[0]==='llamadoAtendido').length,1);
  await assert.rejects(service.attend(1,admin),{status:409});
  row.estado='No Atendido'; await service.recover(); assert.equal(tasks.size,1);
  const timer=[...tasks.values()][0]; timer.fn(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.at(-1).args.p_automatica,true); assert.equal(calls.at(-1).args.p_enfermero_id,nurse);
  service.stop(); assert.equal(tasks.size,0);
});
