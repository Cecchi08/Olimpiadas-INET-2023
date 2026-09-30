-- Solo lectura. Verifica el destino exacto de cada FK en el proyecto consultado.
select
  c.conname as restriccion,
  c.conrelid::regclass as tabla_origen,
  c.confrelid::regclass as tabla_destino,
  pg_get_constraintdef(c.oid) as definicion
from pg_constraint c
where c.contype = 'f'
  and c.conrelid in (
    'public.perfiles'::regclass,
    'public.pacientes'::regclass,
    'public.llamados'::regclass,
    'public.camas'::regclass
  )
order by c.conrelid::regclass::text, c.conname;
