begin;

-- Compatibilidad con instalaciones históricas, sin borrar los datos existentes.
do $$
declare r record;
begin
  for r in select * from (values
    ('areas','coord_x','coordenadas_x'), ('areas','coord_y','coordenadas_y'),
    ('camas','coord_x','coordenadas_x'), ('camas','coord_y','coordenadas_y'),
    ('pacientes','enfermero_id','enfermero_asignado_id'),
    ('llamados','fecha_activacion','fecha_hora_activacion'),
    ('llamados','fecha_atencion','fecha_hora_atencion'),
    ('llamados','tiempo_respuesta_seg','tiempo_respuesta_segundos')
  ) as t(tabla, anterior, actual) loop
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name=r.tabla and column_name=r.anterior)
      and not exists(select 1 from information_schema.columns where table_schema='public' and table_name=r.tabla and column_name=r.actual) then
      execute format('alter table public.%I rename column %I to %I', r.tabla, r.anterior, r.actual);
    end if;
  end loop;
end $$;

alter table public.perfiles add column if not exists nombre text not null default '';
alter table public.perfiles add column if not exists area_asignada_id integer references public.areas(id) on delete set null;
alter table public.perfiles add column if not exists turno text check (turno in ('Manana','Tarde','Noche'));
alter table public.perfiles add column if not exists created_at timestamptz not null default now();
alter table public.llamados add column if not exists cama_id integer references public.camas(id) on delete restrict;
alter table public.llamados add column if not exists enfermero_atencion_id uuid references public.perfiles(id) on delete restrict;
alter table public.llamados add column if not exists enfermero_destino_id uuid references public.perfiles(id) on delete restrict;
alter table public.llamados add column if not exists es_simulacion boolean not null default false;
alter table public.llamados add column if not exists atencion_automatica_en timestamptz;
alter table public.llamados add column if not exists atencion_automatica boolean not null default false;

-- Normaliza únicamente el CHECK del origen (no elimina restricciones ajenas).
do $$ declare r record; begin
  for r in select conname from pg_constraint where conrelid='public.llamados'::regclass
    and contype='c' and pg_get_constraintdef(oid) like '%origen%' loop
    execute format('alter table public.llamados drop constraint %I', r.conname);
  end loop;
end $$;
update public.llamados set origen='Baño' where origen='Bano';
alter table public.llamados add constraint llamados_origen_demo_check check(origen in ('Cama','Baño'));
create index if not exists perfiles_area_asignada_idx on public.perfiles(area_asignada_id);
create index if not exists pacientes_enfermero_demo_idx on public.pacientes(enfermero_asignado_id);
create index if not exists llamados_auto_pendientes_idx on public.llamados(atencion_automatica_en)
  where es_simulacion and estado='No Atendido';
create unique index if not exists llamados_demo_paciente_activo_idx on public.llamados(paciente_id)
  where es_simulacion and estado='No Atendido';
create unique index if not exists llamados_demo_enfermero_activo_idx on public.llamados(enfermero_destino_id)
  where es_simulacion and estado='No Atendido';

create or replace function public.llamado_detalle(p_id integer)
returns jsonb language sql stable security invoker set search_path='' as $$
  select to_jsonb(l) || jsonb_build_object(
    'llamado_id', l.id, 'timestamp', l.fecha_hora_activacion,
    'paciente', jsonb_build_object('id',p.id,'nombre',p.nombre,'dni',p.dni),
    'area',to_jsonb(a),'cama',to_jsonb(c),'enfermero',to_jsonb(e),
    'enfermero_destino',to_jsonb(d), 'area_enfermero',to_jsonb(ae)
  ) from public.llamados l
  join public.pacientes p on p.id=l.paciente_id join public.areas a on a.id=l.area_id
  left join public.camas c on c.id=l.cama_id
  left join public.perfiles e on e.id=l.enfermero_atencion_id
  left join public.perfiles d on d.id=l.enfermero_destino_id
  left join public.areas ae on ae.id=d.area_asignada_id where l.id=p_id;
$$;

drop function if exists public.crear_llamado(integer,integer,text,text);
create or replace function public.crear_llamado(p_paciente_id integer,p_area_id integer,p_origen text,p_tipo text,
  p_simulacion boolean default false,p_actor_id uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.pacientes%rowtype; a public.areas%rowtype; enfermero uuid; llamado integer;
begin
  select * into p from public.pacientes where id=p_paciente_id for update;
  if not found then raise sqlstate 'PT404' using message='Paciente no encontrado'; end if;
  select * into a from public.areas where id=coalesce(p_area_id,p.area_id) for share;
  if not found then raise sqlstate 'PT404' using message='Área no encontrada'; end if;
  p_origen := case when p_origen='Bano' then 'Baño' else p_origen end;
  if p_origen is null or p_origen not in ('Cama','Baño') or p_tipo is null or p_tipo not in ('Normal','Emergencia') then
    raise sqlstate 'PT400' using message='Origen o tipo inválido'; end if;
  if p_origen='Cama' and (p.cama_id is null or p.area_id<>a.id) then
    raise sqlstate 'PT400' using message='El paciente no tiene cama en esa área'; end if;
  if p_origen='Baño' and a.tipo<>'Bano' then
    raise sqlstate 'PT400' using message='Seleccionar el baño de origen'; end if;
  if exists(select 1 from public.llamados where paciente_id=p.id and estado='No Atendido'
    and (p_simulacion or (area_id=a.id and origen=p_origen and tipo=p_tipo))) then
    raise sqlstate 'PT409' using message='El paciente ya tiene un llamado activo'; end if;
  if p_simulacion then
    select e.id into enfermero from public.perfiles e
      left join public.areas ea on ea.id=e.area_asignada_id
      where e.rol='Generico' and not exists(select 1 from public.llamados l
        where l.enfermero_destino_id=e.id and l.estado='No Atendido' and l.es_simulacion)
      order by (e.id=p.enfermero_asignado_id) desc nulls last,
        (e.area_asignada_id=a.id) desc nulls last,
        power(coalesce(ea.coordenadas_x,50)-a.coordenadas_x,2)+power(coalesce(ea.coordenadas_y,17)-a.coordenadas_y,2), e.id
      limit 1 for update of e skip locked;
    if enfermero is null then raise sqlstate 'PT409' using message='No hay enfermeros disponibles para la simulación'; end if;
  end if;
  insert into public.llamados(paciente_id,area_id,origen,tipo,estado,fecha_hora_activacion,
    cama_id,enfermero_destino_id,es_simulacion,atencion_automatica_en)
  values(p.id,a.id,p_origen,p_tipo,'No Atendido',clock_timestamp(),
    case when p_origen='Cama' then p.cama_id else null end,enfermero,p_simulacion,
    case when p_simulacion then clock_timestamp()+interval '30 seconds' else null end)
  returning id into llamado;
  return public.llamado_detalle(llamado);
end $$;

drop function if exists public.atender_llamado(integer,uuid);
create or replace function public.atender_llamado(p_id integer,p_enfermero_id uuid,p_automatica boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare l public.llamados%rowtype; fecha timestamptz;
begin
  select * into l from public.llamados where id=p_id for update;
  if not found then raise sqlstate 'PT404' using message='Llamado no encontrado'; end if;
  if l.estado='Atendido' then raise sqlstate 'PT409' using message='El llamado ya fue atendido'; end if;
  if p_automatica and (not l.es_simulacion or l.atencion_automatica_en is null
    or l.atencion_automatica_en>clock_timestamp() or p_enfermero_id is distinct from l.enfermero_destino_id) then
    raise sqlstate 'PT400' using message='El llamado no admite atención automática ahora'; end if;
  if not exists(select 1 from public.perfiles where id=p_enfermero_id) then
    raise sqlstate 'PT400' using message='Usuario de atención inválido'; end if;
  fecha := greatest(clock_timestamp(),l.fecha_hora_activacion);
  update public.llamados set estado='Atendido',fecha_hora_atencion=fecha,
    tiempo_respuesta_segundos=floor(extract(epoch from fecha-fecha_hora_activacion))::integer,
    enfermero_atencion_id=p_enfermero_id,atencion_automatica=p_automatica where id=p_id;
  return public.llamado_detalle(p_id);
end $$;

create or replace function public.estadisticas_llamados(p_area_id integer default null,p_origen text default null,
  p_tipo text default null,p_estado text default null,p_fecha_desde timestamptz default null,p_fecha_hasta timestamptz default null)
returns jsonb language sql stable security invoker set search_path='' as $$
with f as (
 select l.*,a.nombre as area_nombre from public.llamados l join public.areas a on a.id=l.area_id
 where (p_area_id is null or l.area_id=p_area_id)
 and (p_origen is null or l.origen=case when p_origen='Bano' then 'Baño' else p_origen end)
 and (p_tipo is null or l.tipo=p_tipo) and (p_estado is null or l.estado=p_estado)
 and (p_fecha_desde is null or l.fecha_hora_activacion>=p_fecha_desde)
 and (p_fecha_hasta is null or l.fecha_hora_activacion<=p_fecha_hasta)
), g as (
 select case when grouping(area_id)=0 then 'area' when grouping(tipo)=0 then 'tipo' else 'origen' end as dimension,
 area_id,area_nombre,tipo,origen,count(*) as total_llamados,
 count(*) filter(where estado='Atendido') as atendidos,
 count(*) filter(where estado='No Atendido') as no_atendidos,
 round(avg(tiempo_respuesta_segundos),2) as tiempo_promedio_respuesta_seg
 from f group by grouping sets((area_id,area_nombre),(tipo),(origen))
) select jsonb_build_object('total_llamados',count(*),'atendidos',count(*) filter(where estado='Atendido'),
 'no_atendidos',count(*) filter(where estado='No Atendido'),
 'tiempo_promedio_respuesta_seg',round(avg(tiempo_respuesta_segundos),2),
 'por_area',coalesce((select jsonb_agg(to_jsonb(g)-'dimension'-'tipo'-'origen' order by area_id) from g where dimension='area'),'[]'),
 'por_tipo',coalesce((select jsonb_agg(to_jsonb(g)-'dimension'-'area_id'-'area_nombre'-'origen' order by tipo) from g where dimension='tipo'),'[]'),
 'por_origen',coalesce((select jsonb_agg(to_jsonb(g)-'dimension'-'area_id'-'area_nombre'-'tipo' order by origen) from g where dimension='origen'),'[]')
 ) from f;
$$;

revoke all on function public.llamado_detalle(integer),public.crear_llamado(integer,integer,text,text,boolean,uuid),
 public.atender_llamado(integer,uuid,boolean),public.estadisticas_llamados(integer,text,text,text,timestamptz,timestamptz)
 from public,anon,authenticated;
grant execute on function public.llamado_detalle(integer),public.crear_llamado(integer,integer,text,text,boolean,uuid),
 public.atender_llamado(integer,uuid,boolean),public.estadisticas_llamados(integer,text,text,text,timestamptz,timestamptz) to service_role;
alter table public.perfiles enable row level security;
alter table public.llamados enable row level security;
grant select,insert,update,delete on public.perfiles,public.areas,public.camas,public.pacientes,public.llamados to service_role;
grant usage,select on sequence public.areas_id_seq,public.camas_id_seq,public.pacientes_id_seq,public.llamados_id_seq to service_role;
notify pgrst,'reload schema';
commit;
