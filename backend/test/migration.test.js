import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('actualización del esquema preserva áreas y agrega dimensiones y tipos', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create table public.areas (
      id serial primary key, nombre text not null,
      tipo text not null check (tipo in ('Quirofano','Habitacion','Bano','Recepcion','SalaEspera')),
      coord_x double precision not null, coord_y double precision not null
    );
    insert into public.areas(nombre,tipo,coord_x,coord_y) values ('Recepción','Recepcion',12,17);
  `);
  const sql = await readFile(new URL('../supabase/migrations/20260929152210_frontend_contract.sql', import.meta.url), 'utf8');
  await db.exec(sql);
  const { rows } = await db.query('select * from public.areas');
  assert.deepEqual(rows[0], { id: 1, nombre: 'Recepción', tipo: 'Recepcion', coord_x: 12, coord_y: 17, ancho: 18, alto: 22 });
  await db.exec("insert into public.areas(nombre,tipo,coord_x,coord_y,ancho,alto) values ('Enfermería','Enfermeria',82,17,20,20)");
  await assert.rejects(db.exec('update public.areas set ancho=0 where id=1'), { code: '23514' });
  await db.exec('update public.areas set ancho=25 where id=1');
  await db.exec(sql);
  assert.equal((await db.query('select ancho from public.areas where id=1')).rows[0].ancho, 25);
});
