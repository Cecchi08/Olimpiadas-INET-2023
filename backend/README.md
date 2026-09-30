# Código Azul — Backend

## Corrección de PGRST200

Los controladores usan consultas planas y completan `area`, `cama`, `paciente` y `enfermero` mediante búsquedas por lotes de IDs. No dependen de la detección de relaciones de PostgREST. Se preservan paginación, totales, filtros y objetos anidados; las relaciones nulas o inaccesibles por RLS se presentan como null. Los errores de consulta se propagan.

`src/utils/queries.js` detecta, sin descargar filas, los nombres de columnas del esquema histórico y los del esquema desplegado (`coordenadas_x`, `enfermero_asignado_id`, `fecha_hora_activacion`, etc.). Cachea la detección por cliente/tabla. Reiniciar el backend después de renombrar columnas. Los filtros y las escrituras usan los nombres detectados.

Para reproducir los errores originales sin leer registros clínicos:

```sh
node scripts/diagnose-relationships.mjs
```

El script contiene embeddings intencionalmente, para diagnóstico; el código de producción en `src` no los usa. `supabase/diagnose_relationships.sql` permite inspeccionar las FK sin modificar nada.

En el proyecto revisado, funcionan las relaciones pacientes→perfiles, pacientes→áreas/camas y camas→áreas. Fallaban los joins directos llamados→camas y llamados→perfiles: el esquema desplegado no tiene esas FK ni sus columnas. `perfiles(nombre)` también es incorrecto porque perfiles contiene id/email/rol, sin nombre. La FK perfiles→auth.users no impide las relaciones entre tablas de public. No es necesario exponer auth ni crear vistas ni modificar FK para esta corrección.

Si llamados no tiene cama_id/enfermero_atencion_id, la respuesta conserva `cama: null` y `enfermero: null`. No se deduce la cama histórica ni quién atendió a partir de la asignación actual del paciente. En el esquema histórico que sí guarda esas columnas, ambos objetos se completan normalmente.

Las consultas separadas no constituyen una instantánea transaccional. En un alta o actualización, la escritura puede confirmarse aunque una lectura posterior de sus relaciones falle.

El esquema remoto revisado tampoco publicaba las RPC crear_llamado, atender_llamado y estadisticas_llamados. La migración `supabase/migrations/20260930140537_demo_codigo_azul.sql` instala sus definiciones compatibles y los campos del demo, incluido nombre en perfiles. Ejecutarla en el SQL Editor antes de iniciar esta versión. No ejecutar schema.sql sobre tablas existentes: es una instalación inicial. La migración se entrega y prueba localmente; no se aplicó a la base remota. Ver [prueba completa](../DEMO.md).

Referencias: [relaciones por FK en PostgREST](https://postgrest.org/en/stable/references/api/resource_embedding.html#foreign-key-joins), [errores de caché](https://postgrest.org/en/stable/references/errors.html#group-2-schema-cache), [schema auth de Supabase](https://supabase.com/docs/guides/auth/architecture).

## Instalación

Requiere Node.js 24 y un proyecto Supabase con Data API habilitada para `public`.

Todos los comandos de esta guía se ejecutan dentro de `backend/`:

```sh
cd backend
npm ci
cp .env.example .env
```

En PowerShell: `if (!(Test-Path .env)) { Copy-Item .env.example .env }`. Conservar el archivo existente si ya está configurado.

1. Ejecutar `supabase/schema.sql` completo en el SQL Editor de un proyecto nuevo. El archivo es de instalación inicial y se ejecuta una sola vez.
   Después, ejecutar `supabase/migrations/20260930140537_demo_codigo_azul.sql`. Para el esquema existente descrito en este proyecto, ejecutar solamente esta última migración.
2. En Supabase Auth, deshabilitar el registro público de usuarios. El backend utiliza `auth.admin.createUser`.
3. Crear el primer usuario con email y contraseña desde **Authentication → Users → Add user**, con email confirmado.
4. Asignarle el rol administrador desde el SQL Editor:

```sql
-- Reemplazar el email por el de la cuenta creada en Authentication.
insert into public.perfiles (id, email, rol)
select id, email, 'Administrador' from auth.users where email = 'admin@hospital.com'
on conflict (id) do update set email = excluded.email, rol = excluded.rol;
select id, email, rol from public.perfiles where email = 'admin@hospital.com';
```

5. Completar `.env`: `SUPABASE_KEY` debe ser una clave secreta de servidor (`sb_secret_...`) o la clave heredada `service_role`. `JWT_SECRET` es un secreto propio, independiente del de Supabase. `FRONTEND_URL` acepta orígenes separados por comas, sin rutas.

```sh
npm test
npm run check
npm run smoke
npm run dev
```

## Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@hospital.com","password":"tu-contraseña-segura"}
```

Respuesta: `{ "token": "...", "token_type": "Bearer", "expires_in": 3600, "rol": "Administrador", "usuario": { "id": "...", "email": "...", "rol": "Administrador" } }`.

Enviar `Authorization: Bearer TOKEN` en todas las demás rutas. El JWT dura una hora; al expirar se requiere un nuevo login. El rol vigente se obtiene de `perfiles` en cada petición. Eliminar el perfil revoca acceso HTTP. Socket.IO vuelve a verificarlo cada 30 segundos y desconecta al expirar el JWT.

```http
POST /api/auth/register
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json

{"email":"enfermero@hospital.com","password":"contraseña-segura-123","rol":"Generico"}
```

## Endpoints y cuerpos

| Método | Ruta | Acceso / datos |
| --- | --- | --- |
| POST | `/api/auth/login` | Público: email, password |
| POST | `/api/auth/register` | Admin: email, password (12–128 caracteres), rol |
| GET | `/api/auth/me` | Autenticado |
| GET | `/api/auth/usuarios` | Admin: listado paginado de perfiles (id, email, rol) |
| PUT | `/api/auth/usuarios/:id/rol` | Admin: rol obligatorio; no admite otros cambios |
| PUT | `/api/auth/usuarios/:id` | Admin: rol, nombre, area_asignada_id, turno |
| DELETE | `/api/auth/usuarios/:id` | Admin: elimina el usuario en Auth; impide borrar la propia cuenta |
| GET | `/api/enfermeros` | Autenticado: perfiles Generico con área y contador de pacientes |
| POST | `/api/simulacion/codigo-azul` | Autenticado: paciente_id, origen, tipo y area_id para baño |
| GET | `/api/areas` | Autenticado |
| POST | `/api/areas` | Admin: nombre, tipo, coordenadas_x, coordenadas_y; opcionales ancho, alto |
| PUT | `/api/areas/:id` | Admin: campos a modificar |
| DELETE | `/api/areas/:id` | Admin |
| GET | `/api/camas` | Autenticado; filtro area_id |
| POST | `/api/camas` | Admin: area_id, nombre, coordenadas_x, coordenadas_y |
| PUT | `/api/camas/:id` | Admin: campos a modificar |
| DELETE | `/api/camas/:id` | Admin |
| GET | `/api/pacientes` | Autenticado; filtros area_id/area y enfermero_id/enfermero |
| GET | `/api/pacientes/:id` | Autenticado |
| POST | `/api/pacientes` | Autenticado: nombre, dni, area_id; opcionales datos_medicos, cama_id, enfermero_asignado_id |
| PUT | `/api/pacientes/:id` | Autenticado: campos a modificar |
| DELETE | `/api/pacientes/:id` | Autenticado |
| POST | `/api/llamados/crear` | Autenticado: paciente_id, origen, tipo; area_id opcional (deduce el área del paciente), simulacion opcional |
| PUT | `/api/llamados/:id/atender` | Autenticado; cuerpo vacío; enfermero tomado del JWT |
| GET | `/api/llamados` | Autenticado; filtros de llamados |
| GET | `/api/llamados/activos` | Autenticado; siempre estado No Atendido |
| GET | `/api/reportes/estadisticas` | Autenticado; filtros de llamados |
| GET | `/api/reportes/export/pdf` | Autenticado; filtros de llamados |
| GET | `/api/reportes/export/csv` | Autenticado; filtros de llamados |
| GET | `/health` | Público; proceso activo |
| GET | `/health/ready` | Público; comprueba conexión y columnas del esquema, sin devolver registros |

Tipos de área: `Quirofano`, `Habitacion`, `Bano`, `Recepcion`, `Secretaria`, `SalaEspera`, `Enfermeria`, `Pasillo`.
El registro admite también nombre, area_asignada_id y turno (`Manana`, `Tarde`, `Noche`). Crea Auth y completa perfiles mediante upsert; si falla el perfil, intenta revertir el alta de Auth. La creación de llamados admite `simulacion: true` para despacho de enfermero y atención automática a los 30 segundos. El worker recupera los vencimientos guardados después de reiniciar. Las conexiones entran también a `usuario:<uuid>` para `notificacionEnfermero`.
Las dimensiones ancho/alto son porcentajes mayores que 0 y menores o iguales que 100; valores predeterminados: 20 y 18.
La API acepta los nombres del frontend y conserva compatibilidad de entrada con coord_x, coord_y y enfermero_id. No enviar un alias y su nombre original con valores distintos.
Las respuestas y eventos incluyen coordenadas_x/y, enfermero_asignado_id, fecha_hora_activacion, fecha_hora_atencion y tiempo_respuesta_segundos cuando corresponda, además de las columnas históricas. El origen se devuelve como Baño y se acepta también Bano en las entradas.
Los PUT son actualizaciones parciales. Usar `null` en cama_id/enfermero_id para desasignarlos.
`dni` es una cadena de entre 6 y 12 dígitos. Las coordenadas son números finitos.

Listados: `?page=1&limit=100`, máximo 500 por página. Respuesta `{ data: [], total: 0, page: 1, limit: 100 }`. Leer todas las páginas de `/llamados/activos` para reconstruir el tablero completo.

Filtros de llamados/reportes: `area_id`, `origen` (`Cama`/`Bano`), `tipo` (`Normal`/`Emergencia`), `estado` (`No Atendido`/`Atendido`), `fecha_desde`, `fecha_hasta`. Fechas ISO 8601 con zona horaria; límites inclusivos sobre fecha_activacion. Ejemplo: `?fecha_desde=2026-09-01T00:00:00Z&fecha_hasta=2026-09-30T23:59:59Z`. Codificar `+` como `%2B` si se usan offsets positivos.

Las estadísticas incluyen total_llamados, atendidos, no_atendidos, tiempo_promedio_respuesta_seg, por_area, por_tipo y por_origen. El promedio considera solo llamados atendidos; es null si no existen. Cada grupo tiene sus propios totales y promedio.

Las exportaciones recuperan todas las páginas hasta 100000 registros; si se supera ese límite devuelven 413 para solicitar un rango menor. No son una instantánea transaccional: una atención simultánea puede reflejarse durante su lectura.

## Reglas de integridad

- Cada cama admite un paciente. La cama asignada debe pertenecer al área del paciente.
- Para origen Cama, el paciente debe tener cama en el área indicada. Para origen Bano, el área debe ser de tipo Bano; puede diferir del área donde está internado.
- Un llamado activo por paciente/área/origen/tipo. Duplicados devuelven 409.
- Atender es atómico: solo una petición tiene éxito; las siguientes reciben 409.
- Se añaden cama_id y enfermero_atencion_id a llamados para conservar la cama de origen y la identidad de quien atendió. El nombre de cama/paciente/área mostrado es el vigente.
- Borrar registros referenciados por llamados devuelve 409 y conserva el historial.
- RLS está habilitado y el acceso directo con anon/authenticated está revocado. Toda operación pasa por Express. No publicar SUPABASE_KEY ni JWT_SECRET.
- Todos los usuarios autenticados tienen acceso operativo al hospital y a reportes; los permisos Admin se aplican a las rutas indicadas.

## Socket.IO

Ejemplo para el frontend con `socket.io-client`:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', { auth: { token } });
socket.on('connect', async () => {
  // Consultar todas las páginas de /api/llamados/activos y reconciliar por id.
});
socket.on('nuevoLlamado', llamado => console.log(llamado));
socket.on('codigoAzul', llamado => console.log('Emergencia', llamado));
socket.on('llamadoAtendido', evento => console.log(evento));
socket.on('logSistema', mensaje => console.log(mensaje));
socket.on('connect_error', error => console.error(error.message));
```

El servidor incorpora cada conexión autorizada a `hospital`. `nuevoLlamado` y `codigoAzul` incluyen el llamado, paciente (id/nombre/dni), área, cama y timestamp. `llamadoAtendido` incluye llamado_id, tiempo_respuesta_segundos, enfermero y timestamp de atención. `logSistema` contiene `{ tipo, mensaje, timestamp }`. Los eventos se emiten después de confirmar la escritura en PostgreSQL. Reconectar y consultar llamados activos permite recuperar el estado ante desconexiones; los eventos no tienen entrega persistente. Se conservan las rutas `/api/usuarios` como aliases compatibles.

## Deploy en Render

1. Subir estos archivos a un repositorio Git, incluyendo package-lock.json y excluyendo .env.
2. Crear un **Web Service** conectado al repositorio, runtime Node, **Root Directory: backend**.
3. Build Command: `npm ci --omit=dev`. Start Command: `npm start`.
4. Configurar NODE_VERSION=24, NODE_ENV=production, TRUST_PROXY=1, SUPABASE_URL, SUPABASE_KEY, JWT_SECRET y FRONTEND_URL con el origen HTTPS del frontend. Render proporciona PORT automáticamente.
5. Health Check Path: `/health`. Usar una instancia siempre activa para recibir llamados sin arranque en frío.
6. Usar HTTPS/WSS en el frontend. Desplegar una sola instancia: el adaptador de Socket.IO y el limitador de login usan memoria local. Varias instancias requieren un adaptador compartido y un almacén compartido para el limitador.

## Verificación

`npm test` verifica HTTP/Socket.IO, permisos, el contrato del frontend, SQL real en PostgreSQL embebido (PGlite), actualización sin pérdida de datos y arranque/cierre del proceso. No requiere credenciales ni modifica proyectos remotos.

`npm run check` verifica las tablas, estadísticas y presencia de un administrador contra el Supabase configurado. `npm run smoke` además inicia el backend, comprueba endpoints autenticados, PDF/CSV y Socket.IO, y lo detiene al terminar. Usa un token interno temporal para un perfil administrador existente; no prueba la contraseña de ese usuario ni modifica registros. No ejecutar smoke si ya hay otro servidor en el puerto configurado.

Para prueba manual: `npm run dev` o `npm start`; detener con Ctrl+C. También se admite `node backend/src/server.js` desde la raíz, porque .env se resuelve respecto del archivo de configuración. `npm run export:code` regenera el documento de código completo en la raíz.

## Referencias

- [Supabase: creación administrativa de usuarios](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Supabase: login con contraseña](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Socket.IO: autenticación mediante middleware](https://socket.io/docs/v4/middlewares/)
- [Render: deploy de Express](https://render.com/docs/deploy-node-express-app)
