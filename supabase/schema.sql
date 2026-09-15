begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  rol text not null default 'Generico' check (rol in ('Administrador', 'Generico'))
);

create table public.areas (
  id serial primary key,
  nombre text not null check (char_length(trim(nombre)) between 1 and 120),
  tipo text not null check (tipo in ('Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'SalaEspera')),
  coord_x double precision not null check (coord_x > '-Infinity'::float8 and coord_x < 'Infinity'::float8),
  coord_y double precision not null check (coord_y > '-Infinity'::float8 and coord_y < 'Infinity'::float8)
);

create table public.camas (
  id serial primary key,
  area_id integer not null references public.areas(id) on delete restrict,
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  coord_x double precision not null check (coord_x > '-Infinity'::float8 and coord_x < 'Infinity'::float8),
  coord_y double precision not null check (coord_y > '-Infinity'::float8 and coord_y < 'Infinity'::float8),
  unique (id, area_id),
  unique (area_id, nombre)
);

create table public.pacientes (
  id serial primary key,
  nombre text not null check (char_length(trim(nombre)) between 1 and 160),
  dni text not null unique check (dni ~ '^[0-9]{6,12}$'),
  datos_medicos text not null default '' check (char_length(datos_medicos) <= 20000),
  cama_id integer unique,
  area_id integer not null references public.areas(id) on delete restrict,
  enfermero_id uuid references public.perfiles(id) on delete set null,
  foreign key (cama_id, area_id) references public.camas(id, area_id) on delete restrict
);

create table public.llamados (
  id serial primary key,
  paciente_id integer not null references public.pacientes(id) on delete restrict,
  area_id integer not null references public.areas(id) on delete restrict,
  origen text not null check (origen in ('Cama', 'Bano')),
  tipo text not null check (tipo in ('Normal', 'Emergencia')),
  estado text not null default 'No Atendido' check (estado in ('No Atendido', 'Atendido')),
  fecha_activacion timestamptz not null default now(),
  fecha_atencion timestamptz,
  tiempo_respuesta_seg integer,
  -- Conservan la cama de origen y quién atendió realmente.
  cama_id integer references public.camas(id) on delete restrict,
  enfermero_atencion_id uuid references public.perfiles(id) on delete restrict,
  check ((origen = 'Cama' and cama_id is not null) or (origen = 'Bano' and cama_id is null)),
  check (
    (estado = 'No Atendido' and fecha_atencion is null and tiempo_respuesta_seg is null
      and enfermero_atencion_id is null)
    or
    (estado = 'Atendido' and fecha_atencion is not null and fecha_atencion >= fecha_activacion
      and tiempo_respuesta_seg is not null and tiempo_respuesta_seg >= 0
      and enfermero_atencion_id is not null)
  )
);

create index pacientes_area_idx on public.pacientes(area_id);
create index pacientes_enfermero_idx on public.pacientes(enfermero_id);
create index llamados_paciente_idx on public.llamados(paciente_id);
create index llamados_cama_idx on public.llamados(cama_id);
create index llamados_enfermero_idx on public.llamados(enfermero_atencion_id);
create index llamados_area_fecha_idx on public.llamados(area_id, fecha_activacion);
create index llamados_fecha_idx on public.llamados(fecha_activacion);
create index llamados_tipo_fecha_idx on public.llamados(tipo, fecha_activacion);
create index llamados_origen_fecha_idx on public.llamados(origen, fecha_activacion);
create index llamados_activos_idx on public.llamados(id) where estado = 'No Atendido';
create unique index llamados_activos_unicos_idx
  on public.llamados(paciente_id, area_id, origen, tipo) where estado = 'No Atendido';

-- Este trigger requiere privilegios para escribir desde auth.users hacia public.
-- El rol procede de metadatos administrativos, nunca de user_metadata.
create function private.sincronizar_perfil()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.perfiles(id, email, rol)
    values (new.id, new.email,
      case when new.raw_app_meta_data->>'rol' = 'Administrador'
        then 'Administrador' else 'Generico' end);
  else
    update public.perfiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function private.sincronizar_perfil() from public, anon, authenticated;
create trigger codigo_azul_perfil_insert after insert on auth.users
  for each row execute function private.sincronizar_perfil();
create trigger codigo_azul_perfil_email after update of email on auth.users
  for each row execute function private.sincronizar_perfil();

-- Importa usuarios existentes sin concederles privilegios administrativos.
insert into public.perfiles(id, email)
select id, email from auth.users where email is not null;

create function public.llamado_detalle(p_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(l) || jsonb_build_object(
    'paciente', jsonb_build_object('id', p.id, 'nombre', p.nombre, 'dni', p.dni),
    'area', to_jsonb(a), 'cama', to_jsonb(c),
    'enfermero', case when e.id is null then null else to_jsonb(e) end
  )
  from public.llamados l
  join public.pacientes p on p.id = l.paciente_id
  join public.areas a on a.id = l.area_id
  left join public.camas c on c.id = l.cama_id
  left join public.perfiles e on e.id = l.enfermero_atencion_id
  where l.id = p_id;
$$;

create function public.crear_llamado(p_paciente_id integer, p_area_id integer, p_origen text, p_tipo text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_paciente public.pacientes%rowtype;
  v_area public.areas%rowtype;
  v_id integer;
begin
  if p_origen is null or p_origen not in ('Cama', 'Bano')
    or p_tipo is null or p_tipo not in ('Normal', 'Emergencia') then
    raise sqlstate 'PT400' using message = 'Origen o tipo inválido';
  end if;
  select * into v_paciente from public.pacientes where id = p_paciente_id for share;
  if not found then raise sqlstate 'PT404' using message = 'Paciente no encontrado'; end if;
  select * into v_area from public.areas where id = p_area_id for share;
  if not found then raise sqlstate 'PT404' using message = 'Área no encontrada'; end if;
  if p_origen = 'Cama' and (v_paciente.cama_id is null or v_paciente.area_id <> p_area_id) then
    raise sqlstate 'PT400' using message = 'El paciente no tiene cama en esa área';
  end if;
  if p_origen = 'Bano' and v_area.tipo <> 'Bano' then
    raise sqlstate 'PT400' using message = 'El área de origen debe ser un baño';
  end if;
  insert into public.llamados(paciente_id, area_id, origen, tipo, cama_id)
  values (p_paciente_id, p_area_id, p_origen, p_tipo,
    case when p_origen = 'Cama' then v_paciente.cama_id else null end)
  returning id into v_id;
  return public.llamado_detalle(v_id);
end;
$$;

create function public.atender_llamado(p_id integer, p_enfermero_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_llamado public.llamados%rowtype;
  v_fecha timestamptz;
begin
  select * into v_llamado from public.llamados where id = p_id for update;
  if not found then raise sqlstate 'PT404' using message = 'Llamado no encontrado'; end if;
  if v_llamado.estado = 'Atendido' then
    raise sqlstate 'PT409' using message = 'El llamado ya fue atendido';
  end if;
  if p_enfermero_id is null or not exists (select 1 from public.perfiles where id = p_enfermero_id) then
    raise sqlstate 'PT400' using message = 'Usuario de atención inválido';
  end if;
  v_fecha := greatest(clock_timestamp(), v_llamado.fecha_activacion);
  update public.llamados set estado = 'Atendido', fecha_atencion = v_fecha,
    tiempo_respuesta_seg = floor(extract(epoch from (v_fecha - fecha_activacion)))::integer,
    enfermero_atencion_id = p_enfermero_id
  where id = p_id;
  return public.llamado_detalle(p_id);
end;
$$;

create function public.estadisticas_llamados(
  p_area_id integer default null, p_origen text default null, p_tipo text default null,
  p_estado text default null, p_fecha_desde timestamptz default null, p_fecha_hasta timestamptz default null
)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with filtrados as (
    select l.*, a.nombre as area_nombre from public.llamados l
    join public.areas a on a.id = l.area_id
    where (p_area_id is null or l.area_id = p_area_id)
      and (p_origen is null or l.origen = p_origen)
      and (p_tipo is null or l.tipo = p_tipo)
      and (p_estado is null or l.estado = p_estado)
      and (p_fecha_desde is null or l.fecha_activacion >= p_fecha_desde)
      and (p_fecha_hasta is null or l.fecha_activacion <= p_fecha_hasta)
  ), grupos as (
    select case when grouping(area_id) = 0 then 'area'
      when grouping(tipo) = 0 then 'tipo' else 'origen' end as dimension,
      area_id, area_nombre, tipo, origen,
      count(*) as total_llamados,
      count(*) filter (where estado = 'Atendido') as atendidos,
      count(*) filter (where estado = 'No Atendido') as no_atendidos,
      round(avg(tiempo_respuesta_seg), 2) as tiempo_promedio_respuesta_seg
    from filtrados group by grouping sets ((area_id, area_nombre), (tipo), (origen))
  )
  select jsonb_build_object(
    'total_llamados', count(*),
    'atendidos', count(*) filter (where estado = 'Atendido'),
    'no_atendidos', count(*) filter (where estado = 'No Atendido'),
    'tiempo_promedio_respuesta_seg', round(avg(tiempo_respuesta_seg), 2),
    'por_area', coalesce((select jsonb_agg(to_jsonb(g) - 'dimension' - 'tipo' - 'origen' order by area_id)
      from grupos g where dimension = 'area'), '[]'::jsonb),
    'por_tipo', coalesce((select jsonb_agg(to_jsonb(g) - 'dimension' - 'area_id' - 'area_nombre' - 'origen' order by tipo)
      from grupos g where dimension = 'tipo'), '[]'::jsonb),
    'por_origen', coalesce((select jsonb_agg(to_jsonb(g) - 'dimension' - 'area_id' - 'area_nombre' - 'tipo' order by origen)
      from grupos g where dimension = 'origen'), '[]'::jsonb)
  ) from filtrados;
$$;

alter table public.perfiles enable row level security;
alter table public.areas enable row level security;
alter table public.camas enable row level security;
alter table public.pacientes enable row level security;
alter table public.llamados enable row level security;

-- Acceso exclusivamente desde Express mediante la clave secreta/service_role.
revoke all on table public.perfiles, public.areas, public.camas, public.pacientes, public.llamados
  from public, anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.perfiles, public.areas, public.camas,
  public.pacientes, public.llamados to service_role;
revoke all on sequence public.areas_id_seq, public.camas_id_seq, public.pacientes_id_seq,
  public.llamados_id_seq from public, anon, authenticated;
grant usage, select on sequence public.areas_id_seq, public.camas_id_seq, public.pacientes_id_seq,
  public.llamados_id_seq to service_role;

revoke all on function public.llamado_detalle(integer), public.crear_llamado(integer,integer,text,text),
  public.atender_llamado(integer,uuid),
  public.estadisticas_llamados(integer,text,text,text,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.llamado_detalle(integer), public.crear_llamado(integer,integer,text,text),
  public.atender_llamado(integer,uuid),
  public.estadisticas_llamados(integer,text,text,text,timestamptz,timestamptz) to service_role;

notify pgrst, 'reload schema';
commit;
