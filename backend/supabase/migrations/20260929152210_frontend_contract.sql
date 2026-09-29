-- Actualiza una instalación existente; no borra áreas, pacientes ni llamados.
begin;

alter table public.areas add column if not exists ancho double precision;
alter table public.areas add column if not exists alto double precision;

update public.areas set
  ancho = coalesce(ancho, case tipo
    when 'Recepcion' then 18 when 'Secretaria' then 16 when 'SalaEspera' then 22
    when 'Enfermeria' then 20 when 'Pasillo' then 90 when 'Quirofano' then 22
    when 'Bano' then 9 else 20 end),
  alto = coalesce(alto, case tipo
    when 'Recepcion' then 22 when 'Secretaria' then 20 when 'SalaEspera' then 22
    when 'Enfermeria' then 20 when 'Pasillo' then 8 when 'Quirofano' then 28
    when 'Bano' then 10 else 18 end)
where ancho is null or alto is null;

alter table public.areas
  alter column ancho set default 20,
  alter column alto set default 18,
  alter column ancho set not null,
  alter column alto set not null;

alter table public.areas drop constraint if exists areas_tipo_check;
alter table public.areas add constraint areas_tipo_check check (
  tipo in ('Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'Secretaria', 'SalaEspera', 'Enfermeria', 'Pasillo')
);
alter table public.areas drop constraint if exists areas_ancho_check;
alter table public.areas add constraint areas_ancho_check check (ancho > 0 and ancho <= 100);
alter table public.areas drop constraint if exists areas_alto_check;
alter table public.areas add constraint areas_alto_check check (alto > 0 and alto <= 100);

notify pgrst, 'reload schema';
commit;
