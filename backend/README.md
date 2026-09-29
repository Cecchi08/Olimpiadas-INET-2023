# Código Azul — Backend

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
   Para una instalación anterior, ejecutar solamente `supabase/migrations/20260929152210_frontend_contract.sql`; agrega dimensiones y tipos sin borrar registros y se puede repetir.
2. En Supabase Auth, deshabilitar el registro público de usuarios. El backend utiliza `auth.admin.createUser`.
3. Crear el primer usuario con email y contraseña desde **Authentication → Users → Add user**, con email confirmado.
4. Asignarle el rol administrador desde el SQL Editor:

```sql
update public.perfiles set rol = 'Administrador' where email = 'admin@hospital.com';
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
| GET | `/api/usuarios` | Admin: listado paginado de perfiles (id, email, rol) |
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
| POST | `/api/pacientes` | Admin: nombre, dni, area_id; opcionales datos_medicos, cama_id, enfermero_asignado_id |
| PUT | `/api/pacientes/:id` | Autenticado: campos a modificar |
| DELETE | `/api/pacientes/:id` | Admin |
| POST | `/api/llamados/crear` | Autenticado: paciente_id, area_id, origen, tipo |
| PUT | `/api/llamados/:id/atender` | Autenticado; cuerpo vacío; enfermero tomado del JWT |
| GET | `/api/llamados` | Autenticado; filtros de llamados |
| GET | `/api/llamados/activos` | Autenticado; siempre estado No Atendido |
| GET | `/api/reportes/estadisticas` | Autenticado; filtros de llamados |
| GET | `/api/reportes/export/pdf` | Autenticado; filtros de llamados |
| GET | `/api/reportes/export/csv` | Autenticado; filtros de llamados |
| GET | `/health` | Público; proceso activo |
| GET | `/health/ready` | Público; comprueba conexión y columnas del esquema, sin devolver registros |

Tipos de área: `Quirofano`, `Habitacion`, `Bano`, `Recepcion`, `Secretaria`, `SalaEspera`, `Enfermeria`, `Pasillo`.
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

El servidor incorpora cada conexión autorizada a `hospital`. `nuevoLlamado` y `codigoAzul` incluyen el llamado, paciente (id/nombre/dni), área, cama y timestamp. `llamadoAtendido` incluye id, tiempo_respuesta_seg, enfermero y fecha_atencion. `logSistema` es texto plano. Los eventos se emiten después de confirmar la escritura en PostgreSQL. Reconectar y consultar llamados activos permite recuperar el estado ante desconexiones; los eventos no tienen entrega persistente.

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
