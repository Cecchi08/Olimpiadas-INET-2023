# Código Azul — Código completo del backend

Archivos relativos a la raíz del repositorio. Las credenciales locales no se incluyen.

## backend/package.json

~~~~json
{
  "name": "codigo-azul-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24 <25" },
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "node --test",
    "check": "node scripts/check-backend.mjs",
    "smoke": "node scripts/smoke.mjs",
    "export:code": "node scripts/export-code.mjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "2.116.0",
    "cors": "2.8.6",
    "dotenv": "17.4.2",
    "express": "5.2.1",
    "express-rate-limit": "8.7.0",
    "express-validator": "7.3.2",
    "json2csv": "5.0.7",
    "jsonwebtoken": "9.0.3",
    "pdfkit": "0.20.2",
    "socket.io": "4.8.3"
  },
  "devDependencies": {
    "@electric-sql/pglite": "0.5.8",
    "socket.io-client": "4.8.3",
    "supertest": "7.2.2"
  }
}
~~~~

## backend/.env.example

~~~~text
SUPABASE_URL=https://TU_PROYECTO.supabase.co
# Clave secreta de servidor o service_role. Nunca usar en el frontend.
SUPABASE_KEY=TU_CLAVE_SECRETA_DE_SUPABASE
# Generar: node --input-type=module -e "import {randomBytes} from 'node:crypto'; console.log(randomBytes(48).toString('hex'))"
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
# Render: 1. Local: 0.
TRUST_PROXY=0
~~~~

## backend/README.md

~~~~markdown
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
~~~~

## backend/src/app.js

~~~~javascript
import express from 'express';
import cors from 'cors';
import { createAuth } from './middlewares/authMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError, dbResult } from './utils/errors.js';
import { createControllers } from './controllers/index.js';
import { createRoutes } from './routes/index.js';

export function createApp({ env, db, newAuthClient, publish = () => {} }) {
  const app = express();
  const auth = createAuth(db, env.jwtSecret);
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);
  app.use(cors({
    origin: (origin, callback) => callback(
      origin && !env.origins.includes(origin) ? new AppError(403, 'Origen no permitido') : null, true
    ),
    exposedHeaders: ['Content-Disposition']
  }));
  app.use(express.json({ limit: '64kb' }));
  app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', async (req, res) => {
    dbResult(await db.from('areas').select('id,coord_x,coord_y,ancho,alto').limit(1));
    dbResult(await db.from('perfiles').select('id,email,rol').limit(1));
    res.json({ status: 'ok', database: 'connected' });
  });
  const controllers = createControllers({ db, newAuthClient, auth, publish });
  app.use('/api', createRoutes(controllers, auth.authMiddleware));
  app.use((req, res, next) => next(new AppError(404, 'Ruta no encontrada')));
  app.use(errorHandler);
  return { app, auth };
}
~~~~

## backend/src/config/env.js

~~~~javascript
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolver desde este archivo permite también: node backend/src/server.js.
export const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
dotenv.config({ path: envPath, quiet: true });

export function readEnv(source = process.env) {
  for (const key of ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET', 'FRONTEND_URL']) {
    if (!source[key]?.trim()) throw new Error(`Falta la variable ${key} en backend/.env`);
  }
  if (/TU_PROYECTO|TU_CLAVE|REEMPLAZAR/.test(source.SUPABASE_URL + source.SUPABASE_KEY)) {
    throw new Error('Completar SUPABASE_URL y SUPABASE_KEY con valores reales en backend/.env');
  }
  const url = new URL(source.SUPABASE_URL);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('SUPABASE_URL inválida');
  if (source.JWT_SECRET.length < 32 || source.JWT_SECRET.startsWith('REEMPLAZAR')) {
    throw new Error('JWT_SECRET debe ser aleatorio y tener al menos 32 caracteres');
  }
  const origins = source.FRONTEND_URL.split(',').map(value => {
    const origin = new URL(value.trim());
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
      origin.pathname !== '/' || origin.search || origin.hash) {
      throw new Error('FRONTEND_URL debe contener orígenes HTTP/HTTPS sin rutas');
    }
    return origin.origin;
  });
  const port = Number(source.PORT || 3000);
  const trustProxy = Number(source.TRUST_PROXY || 0);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválido');
  if (![0, 1].includes(trustProxy)) throw new Error('TRUST_PROXY debe ser 0 o 1');
  return {
    supabaseUrl: url.href, supabaseKey: source.SUPABASE_KEY,
    jwtSecret: source.JWT_SECRET, origins, port, trustProxy
  };
}
~~~~

## backend/src/config/supabase.js

~~~~javascript
import { createClient } from '@supabase/supabase-js';

export function createSupabase(env) {
  const newClient = () => createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, options = {}) => fetch(input, {
        ...options,
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000)
      })
    }
  });
  return { db: newClient(), newAuthClient: newClient };
}
~~~~

## backend/src/controllers/index.js

~~~~javascript
import { AppError, dbResult } from '../utils/errors.js';
import { paginate, applyFilters, allLlamados, llamadoSelect, pacienteSelect } from '../utils/queries.js';
import { createCsv, createPdf } from '../utils/exports.js';
import { presentarRegistro, presentarListado } from '../utils/contrato.js';

export function createControllers({ db, newAuthClient, auth, publish }) {
  function crud(table, select = '*') {
    return {
      list: async (req, res) => {
        let query = db.from(table).select(select, { count: 'exact' });
        const area = req.filters.area_id ?? req.filters.area;
        const nurse = req.filters.enfermero_asignado_id ?? req.filters.enfermero_id ?? req.filters.enfermero;
        if (area !== undefined) query = query.eq('area_id', area);
        if (nurse !== undefined) query = query.eq('enfermero_id', nurse);
        res.json(presentarListado(await paginate(query, req.filters)));
      },
      get: async (req, res) => res.json(presentarRegistro(dbResult(await db.from(table)
        .select(select).eq('id', req.params.id).single()))),
      create: async (req, res) => res.status(201).json(presentarRegistro(dbResult(await db.from(table)
        .insert(req.input).select(select).single()))),
      update: async (req, res) => res.json(presentarRegistro(dbResult(await db.from(table)
        .update(req.input).eq('id', req.params.id).select(select).single()))),
      remove: async (req, res) => {
        dbResult(await db.from(table).delete().eq('id', req.params.id).select('id').single());
        res.status(204).end();
      }
    };
  }
  const authController = {
    login: async (req, res) => {
      // Cliente aislado: el login no modifica la sesión del cliente privilegiado.
      const { data, error } = await newAuthClient().auth.signInWithPassword(req.input);
      if (error) {
        if (error.status === 429) throw new AppError(429, 'Demasiados intentos');
        if (error.status >= 500 || !error.status) throw new AppError(503, 'Autenticación no disponible');
        throw new AppError(401, 'Credenciales inválidas');
      }
      const profile = dbResult(await db.from('perfiles').select('id,email,rol')
        .eq('id', data.user.id).maybeSingle());
      if (!profile) throw new AppError(403, 'El usuario no tiene perfil habilitado');
      res.json({ token: auth.sign(profile), token_type: 'Bearer', expires_in: 3600,
        rol: profile.rol, usuario: profile });
    },
    register: async (req, res) => {
      const { email, password, rol } = req.input;
      const { data, error } = await db.auth.admin.createUser({
        email, password, email_confirm: true, app_metadata: { rol }
      });
      if (error) {
        if (['email_exists', 'user_already_exists'].includes(error.code)) {
          throw new AppError(409, 'El usuario ya existe');
        }
        throw new AppError(error.status >= 500 ? 503 : 400, 'No se pudo crear el usuario');
      }
      // El trigger crea el perfil en la misma transacción que auth.users.
      res.status(201).json(dbResult(await db.from('perfiles').select('id,email,rol')
        .eq('id', data.user.id).single()));
    },
    me: (req, res) => {
      const { id, email, rol } = req.user;
      res.json({ id, email, rol });
    }
  };
  const llamados = {
    create: async (req, res) => {
      const row = dbResult(await db.rpc('crear_llamado', {
        p_paciente_id: req.input.paciente_id, p_area_id: req.input.area_id,
        p_origen: req.input.origen, p_tipo: req.input.tipo
      }));
      const event = { ...presentarRegistro(row), timestamp: row.fecha_activacion };
      publish('nuevoLlamado', event);
      if (row.tipo === 'Emergencia') publish('codigoAzul', event);
      publish('logSistema', `Llamado #${row.id} activado (${row.tipo}).`);
      res.status(201).json(presentarRegistro(row));
    },
    attend: async (req, res) => {
      const row = dbResult(await db.rpc('atender_llamado', {
        p_id: Number(req.params.id), p_enfermero_id: req.user.id
      }));
      publish('llamadoAtendido', presentarRegistro({ id: row.id, tiempo_respuesta_seg: row.tiempo_respuesta_seg,
        enfermero: row.enfermero, fecha_atencion: row.fecha_atencion }));
      publish('logSistema', `Llamado #${row.id} atendido en ${row.tiempo_respuesta_seg} segundos.`);
      res.json(presentarRegistro(row));
    },
    list: async (req, res) => res.json(presentarListado(await paginate(applyFilters(
      db.from('llamados').select(llamadoSelect, { count: 'exact' }), req.filters
    ), req.filters))),
    active: async (req, res) => {
      req.filters.estado = 'No Atendido';
      return llamados.list(req, res);
    }
  };
  const reportes = {
    stats: async (req, res) => {
      const params = Object.fromEntries(['area_id', 'origen', 'tipo', 'estado', 'fecha_desde', 'fecha_hasta']
        .map(key => [`p_${key}`, req.filters[key] ?? null]));
      res.json(dbResult(await db.rpc('estadisticas_llamados', params)));
    },
    csv: async (req, res) => {
      const rows = await allLlamados(db, req.filters);
      res.attachment('llamados.csv').type('text/csv; charset=utf-8').send(createCsv(rows));
    },
    pdf: async (req, res) => {
      const rows = await allLlamados(db, req.filters);
      const pdf = await createPdf(rows);
      res.attachment('llamados.pdf').type('application/pdf').send(pdf);
    }
  };
  return { auth: authController, usuarios: crud('perfiles', 'id,email,rol'), areas: crud('areas'), camas: crud('camas', '*,area:areas(*)'),
    pacientes: crud('pacientes', pacienteSelect), llamados, reportes };
}
~~~~

## backend/src/middlewares/authMiddleware.js

~~~~javascript
import jwt from 'jsonwebtoken';
import { AppError, dbResult } from '../utils/errors.js';

const tokenOptions = { issuer: 'codigo-azul', audience: 'hospital' };

export function createAuth(db, secret) {
  async function authenticate(token) {
    let claims;
    try {
      claims = jwt.verify(token, secret, { ...tokenOptions, algorithms: ['HS256'] });
      if (!claims.sub || !Number.isInteger(claims.exp)) throw new Error();
    } catch {
      throw new AppError(401, 'Token inválido o expirado');
    }
    const profile = dbResult(await db.from('perfiles').select('id,email,rol')
      .eq('id', claims.sub).maybeSingle());
    if (!profile || !['Administrador', 'Generico'].includes(profile.rol)) {
      throw new AppError(401, 'Usuario no autorizado');
    }
    return { ...profile, exp: claims.exp };
  }
  return {
    authenticate,
    sign: profile => jwt.sign({ rol: profile.rol }, secret, {
      ...tokenOptions, subject: profile.id, algorithm: 'HS256', expiresIn: '1h'
    }),
    authMiddleware: async (req, res, next) => {
      try {
        const match = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
        if (!match) throw new AppError(401, 'Se requiere Bearer token');
        req.user = await authenticate(match[1]);
        next();
      } catch (error) { next(error); }
    }
  };
}

export const roleMiddleware = role => (req, res, next) => {
  if (req.user?.rol !== role) return next(new AppError(403, 'Permisos insuficientes'));
  next();
};
~~~~

## backend/src/middlewares/errorHandler.js

~~~~javascript
import { AppError } from '../utils/errors.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') error = new AppError(400, 'JSON inválido');
  if (error.type === 'entity.too.large') error = new AppError(413, 'Cuerpo demasiado grande');
  if (!(error instanceof AppError)) console.error('Error interno', { name: error.name });
  res.status(error instanceof AppError ? error.status : 500).json({
    error: error instanceof AppError ? error.message : 'Error interno del servidor',
    ...(error.details ? {
      detalles: error.details,
      details: error.details.map(detail => ({ field: detail.campo, message: detail.mensaje }))
    } : {})
  });
}
~~~~

## backend/src/middlewares/validate.js

~~~~javascript
import { body, param, query, matchedData, validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';

const types = ['Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'Secretaria', 'SalaEspera', 'Enfermeria', 'Pasillo'];
const positiveId = field => field.isInt({ min: 1, max: 2147483647 }).toInt();
const text = (field, max) => field.isString().bail().trim().isLength({ min: 1, max });
const optional = (field, partial) => partial ? field.optional() : field;
const coordinate = field => field.isFloat().bail().toFloat().custom(Number.isFinite);
const alias = (canonical, legacy) => (req, res, next) => {
  const input = req.body;
  if (!input || !Object.hasOwn(input, canonical)) return next();
  if (Object.hasOwn(input, legacy) && input[canonical] !== input[legacy]) {
    return next(new AppError(400, `Los campos ${canonical} y ${legacy} no coinciden`));
  }
  input[legacy] = input[canonical];
  next();
};
const coordinates = () => [alias('coordenadas_x', 'coord_x'), alias('coordenadas_y', 'coord_y')];
const origin = field => field.customSanitizer(value => value === 'Baño' ? 'Bano' : value).isIn(['Cama', 'Bano']);

export const idRule = () => positiveId(param('id'));
export const loginRules = () => [
  body('email').isString().bail().trim().isEmail().isLength({ max: 254 }).toLowerCase(),
  body('password').isString().bail().isLength({ min: 1, max: 128 })
];
export const registerRules = () => [
  ...loginRules(), body('password').isLength({ min: 12, max: 128 }),
  body('rol').isIn(['Administrador', 'Generico'])
];
export const areaRules = (partial = false) => [
  ...coordinates(),
  text(optional(body('nombre'), partial), 120),
  optional(body('tipo'), partial).isIn(types),
  coordinate(optional(body('coord_x'), partial)), coordinate(optional(body('coord_y'), partial)),
  body('ancho').optional().isFloat({ gt: 0, max: 100 }).toFloat(),
  body('alto').optional().isFloat({ gt: 0, max: 100 }).toFloat()
];
export const camaRules = (partial = false) => [
  ...coordinates(),
  positiveId(optional(body('area_id'), partial)), text(optional(body('nombre'), partial), 80),
  coordinate(optional(body('coord_x'), partial)), coordinate(optional(body('coord_y'), partial))
];
export const pacienteRules = (partial = false) => [
  alias('enfermero_asignado_id', 'enfermero_id'),
  text(optional(body('nombre'), partial), 160),
  optional(body('dni'), partial).isString().bail().matches(/^\d{6,12}$/),
  body('datos_medicos').optional().isString().isLength({ max: 20000 }),
  positiveId(body('cama_id').optional({ values: 'null' })),
  positiveId(optional(body('area_id'), partial)),
  body('enfermero_id').optional({ values: 'null' }).isUUID()
];
export const llamadoRules = () => [
  positiveId(body('paciente_id')), positiveId(body('area_id')),
  origin(body('origen')), body('tipo').isIn(['Normal', 'Emergencia'])
];
export const pagingRules = () => [
  positiveId(query('page').optional()), query('limit').optional().isInt({ min: 1, max: 500 }).toInt()
];
export const areaFilter = () => positiveId(query('area_id').optional());
export const pacienteFilters = () => [
  areaFilter(), positiveId(query('area').optional()),
  query('enfermero_id').optional().isUUID(), query('enfermero').optional().isUUID(),
  query('enfermero_asignado_id').optional().isUUID()
];
export const llamadoFilters = () => [
  areaFilter(), origin(query('origen').optional()),
  query('tipo').optional().isIn(['Normal', 'Emergencia']),
  query('estado').optional().isIn(['No Atendido', 'Atendido']),
  ...['fecha_desde', 'fecha_hasta'].map(key => query(key).optional().isISO8601({ strict: true })
    .bail().matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/).withMessage('Usar ISO 8601 con zona horaria')),
  query('fecha_hasta').optional().custom((value, { req }) => {
    if (req.query.fecha_desde && Date.parse(value) < Date.parse(req.query.fecha_desde)) {
      throw new Error('fecha_hasta debe ser mayor o igual a fecha_desde');
    }
    return true;
  })
];

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(400, 'Datos inválidos', errors.array().map(e => ({
    campo: e.path, mensaje: e.msg
  }))));
  req.input = Object.fromEntries(Object.entries(matchedData(req, {
    locations: ['body'], includeOptionals: true
  })).filter(([, value]) => value !== undefined));
  req.filters = matchedData(req, { locations: ['query'] });
  if (req.method === 'PUT' && !req.path.endsWith('/atender') && !Object.keys(req.input).length) {
    return next(new AppError(400, 'Enviar al menos un campo editable'));
  }
  next();
}
~~~~

## backend/src/routes/index.js

~~~~javascript
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { roleMiddleware } from '../middlewares/authMiddleware.js';
import * as v from '../middlewares/validate.js';

export function createRoutes(controllers, authMiddleware) {
  const router = Router();
  const admin = roleMiddleware('Administrador');
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Demasiados intentos. Intentar más tarde.' } });
  router.post('/auth/login', loginLimit, v.loginRules(), v.validate, controllers.auth.login);
  router.use(authMiddleware);
  router.post('/auth/register', admin, v.registerRules(), v.validate, controllers.auth.register);
  router.get('/auth/me', controllers.auth.me);
  router.get('/usuarios', admin, v.pagingRules(), v.validate, controllers.usuarios.list);

  for (const [resource, rules, filters] of [
    ['areas', v.areaRules, () => []],
    ['camas', v.camaRules, () => [v.areaFilter()]],
    ['pacientes', v.pacienteRules, v.pacienteFilters]
  ]) {
    const controller = controllers[resource];
    router.get(`/${resource}`, filters(), v.pagingRules(), v.validate, controller.list);
    router.post(`/${resource}`, admin, rules(), v.validate, controller.create);
    router.put(`/${resource}/:id`, ...(resource === 'pacientes' ? [] : [admin]),
      v.idRule(), rules(true), v.validate, controller.update);
    router.delete(`/${resource}/:id`, admin, v.idRule(), v.validate, controller.remove);
  }
  router.get('/pacientes/:id', v.idRule(), v.validate, controllers.pacientes.get);
  router.post('/llamados/crear', v.llamadoRules(), v.validate, controllers.llamados.create);
  router.put('/llamados/:id/atender', v.idRule(), v.validate, controllers.llamados.attend);
  router.get('/llamados/activos', v.llamadoFilters(), v.pagingRules(), v.validate, controllers.llamados.active);
  router.get('/llamados', v.llamadoFilters(), v.pagingRules(), v.validate, controllers.llamados.list);
  router.get('/reportes/estadisticas', v.llamadoFilters(), v.validate, controllers.reportes.stats);
  router.get('/reportes/export/pdf', v.llamadoFilters(), v.validate, controllers.reportes.pdf);
  router.get('/reportes/export/csv', v.llamadoFilters(), v.validate, controllers.reportes.csv);
  return router;
}
~~~~

## backend/src/server.js

~~~~javascript
import { createServer } from 'node:http';
import { readEnv } from './config/env.js';
import { createSupabase } from './config/supabase.js';
import { createApp } from './app.js';
import { configureSockets } from './sockets/index.js';

try {
  const env = readEnv();
  const clients = createSupabase(env);
  let io;
  const { app, auth } = createApp({ env, ...clients,
    publish: (event, payload) => io.to('hospital').emit(event, payload) });
  const server = createServer(app);
  io = configureSockets(server, env, auth);
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE'
      ? `No se pudo iniciar: el puerto ${env.port} ya está ocupado.`
      : `No se pudo iniciar el servidor (${error.code || error.name}).`);
    process.exitCode = 1;
    io.close();
  });
  server.listen(env.port, '0.0.0.0', () => {
    console.log(`Código Azul escuchando en http://localhost:${env.port}`);
    process.send?.({ type: 'ready', port: env.port });
  });

  let stopping = false;
  function shutdown() {
    if (stopping) return;
    stopping = true;
    console.log('Deteniendo Código Azul…');
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    io.close(() => {
      clearTimeout(timeout);
      console.log('Backend detenido.');
      process.exit(0);
    });
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  // Canal privado disponible únicamente cuando se ejecuta con child_process.fork.
  process.on('message', message => { if (message?.type === 'shutdown') shutdown(); });
} catch (error) {
  console.error(`No se pudo iniciar Código Azul: ${error.message}`);
  process.exitCode = 1;
}
~~~~

## backend/src/sockets/index.js

~~~~javascript
import { Server } from 'socket.io';

export function configureSockets(server, env, auth) {
  const io = new Server(server, {
    cors: { origin: env.origins, methods: ['GET', 'POST'] },
    allowRequest: (req, callback) => callback(null, !req.headers.origin || env.origins.includes(req.headers.origin))
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') throw new Error();
      socket.data.user = await auth.authenticate(token);
      next();
    } catch { next(new Error('No autorizado')); }
  });
  io.on('connection', socket => {
    socket.join('hospital');
    socket.emit('logSistema', 'Conectado al sistema Código Azul.');
    const expiry = setTimeout(() => socket.disconnect(true),
      Math.max(0, socket.data.user.exp * 1000 - Date.now()));
    expiry.unref();
    let checking = false;
    const check = setInterval(async () => {
      if (checking) return;
      checking = true;
      try { await auth.authenticate(socket.handshake.auth.token); }
      catch { socket.disconnect(true); }
      finally { checking = false; }
    }, 30000);
    check.unref();
    socket.on('disconnect', () => { clearTimeout(expiry); clearInterval(check); });
  });
  return io;
}
~~~~

## backend/src/utils/contrato.js

~~~~javascript
// Adaptación HTTP: conservamos las columnas históricas de PostgreSQL y
// exponemos también los nombres usados por el frontend.
export function presentarRegistro(row) {
  if (!row || typeof row !== 'object') return row;
  const result = { ...row };
  for (const [stored, api] of [
    ['coord_x', 'coordenadas_x'], ['coord_y', 'coordenadas_y'],
    ['enfermero_id', 'enfermero_asignado_id'],
    ['fecha_activacion', 'fecha_hora_activacion'],
    ['fecha_atencion', 'fecha_hora_atencion'],
    ['tiempo_respuesta_seg', 'tiempo_respuesta_segundos']
  ]) {
    if (Object.hasOwn(row, stored)) result[api] = row[stored];
  }
  if (row.origen === 'Bano') result.origen = 'Baño';
  for (const key of ['area', 'cama', 'paciente']) {
    if (row[key]) result[key] = presentarRegistro(row[key]);
  }
  return result;
}

export function presentarListado(result) {
  return { ...result, data: result.data.map(presentarRegistro) };
}
~~~~

## backend/src/utils/errors.js

~~~~javascript
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function dbResult({ data, error }) {
  if (error) {
    const errors = {
      '23505': [409, 'El registro ya existe o la cama está ocupada'],
      '23503': [409, 'Referencia inexistente o registro utilizado por otros datos'],
      '23001': [409, 'El registro está utilizado por otros datos'],
      '23514': [400, 'Los datos incumplen una restricción'],
      '22P02': [400, 'Formato de datos inválido'],
      PGRST116: [404, 'Registro no encontrado'],
      PGRST205: [503, 'Faltan tablas en Supabase. Ejecutar backend/supabase/schema.sql en un proyecto nuevo.'],
      PGRST202: [503, 'Faltan funciones en Supabase. Revisar la instalación del esquema.'],
      PGRST204: [503, 'El esquema de Supabase está desactualizado. Aplicar la actualización de backend/supabase/migrations.'],
      '42703': [503, 'El esquema de Supabase está desactualizado. Aplicar la actualización de backend/supabase/migrations.'],
      PT400: [400, error.message], PT404: [404, error.message], PT409: [409, error.message]
    };
    const mapped = errors[error.code];
    if (mapped) throw new AppError(...mapped);
    console.error('Error de base de datos', { code: error.code });
    throw new AppError(503, 'Base de datos no disponible');
  }
  return data;
}
~~~~

## backend/src/utils/exports.js

~~~~javascript
import PDFDocument from 'pdfkit';
import json2csv from 'json2csv';

const fields = ['id', 'paciente', 'area', 'cama', 'origen', 'tipo', 'estado',
  'fecha_activacion', 'fecha_atencion', 'tiempo_respuesta_seg', 'enfermero'];

export function exportRows(rows) {
  return rows.map(row => ({
    id: row.id, paciente: row.paciente?.nombre || '', area: row.area?.nombre || '',
    cama: row.cama?.nombre || '', origen: row.origen, tipo: row.tipo, estado: row.estado,
    fecha_activacion: row.fecha_activacion, fecha_atencion: row.fecha_atencion || '',
    tiempo_respuesta_seg: row.tiempo_respuesta_seg ?? '', enfermero: row.enfermero?.email || ''
  }));
}

export function createCsv(rows) {
  const safe = exportRows(rows).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key, typeof value === 'string' && /^[\s\uFEFF]*[=+\-@\t\r\n]/u.test(value) ? `'${value}` : value
  ])));
  return '\uFEFF' + new json2csv.Parser({ fields }).parse(safe);
}

export function createPdf(rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(20).text('Código Azul - Reporte de llamados');
    doc.moveDown().fontSize(10).text(`Generado: ${new Date().toISOString()} | Total: ${rows.length}`);
    for (const row of exportRows(rows)) {
      if (doc.y > 665) doc.addPage();
      doc.moveDown().fontSize(11).text(`#${row.id} | ${row.tipo} | ${row.estado}`);
      doc.fontSize(9).text(`Paciente: ${row.paciente} | Área: ${row.area} | Cama: ${row.cama}`);
      doc.text(`Origen: ${row.origen} | Activación: ${row.fecha_activacion}`);
      doc.text(`Atención: ${row.fecha_atencion || '-'} | Respuesta: ${row.tiempo_respuesta_seg === '' ? '-' : row.tiempo_respuesta_seg + ' s'}`);
      doc.text(`Enfermero: ${row.enfermero || '-'}`);
    }
    if (!rows.length) doc.moveDown().text('Sin llamados para los filtros seleccionados.');
    doc.end();
  });
}
~~~~

## backend/src/utils/queries.js

~~~~javascript
import { AppError, dbResult } from './errors.js';

export const llamadoSelect = `*,paciente:pacientes(id,nombre,dni),area:areas(*),
  cama:camas(*),enfermero:perfiles!llamados_enfermero_atencion_id_fkey(id,email,rol)`;
export const pacienteSelect = '*,area:areas(*),cama:camas(*),enfermero:perfiles(id,email,rol)';

export function applyFilters(query, filters) {
  for (const key of ['area_id', 'origen', 'tipo', 'estado']) {
    if (filters[key] !== undefined) query = query.eq(key, filters[key]);
  }
  if (filters.fecha_desde) query = query.gte('fecha_activacion', filters.fecha_desde);
  if (filters.fecha_hasta) query = query.lte('fecha_activacion', filters.fecha_hasta);
  return query;
}

export async function paginate(query, filters) {
  const page = filters.page || 1;
  const limit = filters.limit || 100;
  const result = await query.order('id').range((page - 1) * limit, page * limit - 1);
  return { data: dbResult(result), total: result.count, page, limit };
}

export async function allLlamados(db, filters) {
  const latest = dbResult(await applyFilters(db.from('llamados').select('id'), filters)
    .order('id', { ascending: false }).limit(1));
  if (!latest.length) return [];
  const rows = [];
  let cursor = 0;
  while (true) {
    const batch = dbResult(await applyFilters(db.from('llamados').select(llamadoSelect), filters)
      .gt('id', cursor).lte('id', latest[0].id).order('id').limit(500));
    if (!batch.length) break;
    rows.push(...batch);
    if (rows.length > 100000) throw new AppError(413, 'Acotar las fechas del reporte a menos de 100000 llamados');
    cursor = batch.at(-1).id;
  }
  return rows;
}
~~~~

## backend/supabase/migrations/20260929152210_frontend_contract.sql

~~~~sql
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
~~~~

## backend/supabase/schema.sql

~~~~sql
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
  tipo text not null check (tipo in ('Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'Secretaria', 'SalaEspera', 'Enfermeria', 'Pasillo')),
  coord_x double precision not null check (coord_x > '-Infinity'::float8 and coord_x < 'Infinity'::float8),
  coord_y double precision not null check (coord_y > '-Infinity'::float8 and coord_y < 'Infinity'::float8),
  ancho double precision not null default 20 check (ancho > 0 and ancho <= 100),
  alto double precision not null default 18 check (alto > 0 and alto <= 100)
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
~~~~

## backend/test/api.test.js

~~~~javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { io as connect } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { configureSockets } from '../src/sockets/index.js';
import { allLlamados } from '../src/utils/queries.js';
import { createCsv, createPdf } from '../src/utils/exports.js';
import { dbResult } from '../src/utils/errors.js';

const admin = { id: '11111111-1111-4111-8111-111111111111', email: 'admin@hospital.com', rol: 'Administrador' };
const nurse = { id: '22222222-2222-4222-8222-222222222222', email: 'nurse@hospital.com', rol: 'Generico' };
const env = { jwtSecret: 'test-secret-with-more-than-32-characters', origins: ['http://localhost:5173'], trustProxy: 0 };

function fixture() {
  const state = { profiles: [admin, nurse], calls: [], mutations: [], events: [] };
  const db = {
    from(table) {
      let rows = table === 'perfiles' ? state.profiles : table === 'llamados' ? state.calls : [];
      let single = false;
      let count = false;
      const query = {
        select(columns, options) { count = options?.count === 'exact'; return this; },
        eq(key, value) { rows = rows.filter(row => String(row[key]) === String(value)); return this; },
        gt(key, value) { rows = rows.filter(row => row[key] > value); return this; },
        lte(key, value) { rows = rows.filter(row => row[key] <= value); return this; },
        gte(key, value) { rows = rows.filter(row => row[key] >= value); return this; },
        order(key, options) { rows = [...rows].sort((a,b) => (a[key] - b[key]) * (options?.ascending === false ? -1 : 1)); return this; },
        limit(value) { rows = rows.slice(0, Math.min(value, 2)); return this; },
        range(start, end) { rows = rows.slice(start, end + 1); return this; },
        maybeSingle() { single = true; return this; },
        single() { single = true; return this; },
        insert(input) { state.mutations.push({ table, input }); rows = [{ id: 1, ...input }]; return this; },
        update(input) { state.mutations.push({ table, input }); rows = [{ id: 1, ...input }]; return this; },
        delete() { rows = [{ id: 1 }]; return this; },
        then(resolve, reject) { return Promise.resolve({ data: single ? rows[0] ?? null : rows,
          error: null, count: count ? rows.length : null }).then(resolve, reject); }
      };
      return query;
    },
    async rpc(name, args) {
      if (name === 'crear_llamado') {
        const row = { id: 1, tipo: args.p_tipo, origen: args.p_origen, estado: 'No Atendido',
          fecha_activacion: new Date().toISOString(), paciente: { id: 1, nombre: 'Paciente' },
          area: { id: 1, nombre: 'Habitación' }, cama: { id: 1, nombre: 'Cama' } };
        state.calls.push(row);
        return { data: row, error: null };
      }
      if (name === 'atender_llamado') {
        const row = state.calls.find(row => row.id === args.p_id);
        if (!row) return { error: { code: 'PT404', message: 'Llamado no encontrado' } };
        if (row.estado === 'Atendido') return { error: { code: 'PT409', message: 'El llamado ya fue atendido' } };
        Object.assign(row, { estado: 'Atendido', tiempo_respuesta_seg: 15,
          fecha_atencion: new Date().toISOString(), enfermero: state.profiles.find(p => p.id === args.p_enfermero_id) });
        return { data: row, error: null };
      }
      return { data: { total_llamados: state.calls.length }, error: null };
    },
    auth: { admin: { async createUser(input) {
      const profile = { id: '33333333-3333-4333-8333-333333333333', email: input.email, rol: input.app_metadata.rol };
      state.profiles.push(profile);
      return { data: { user: profile }, error: null };
    } } }
  };
  const newAuthClient = () => ({ auth: { signInWithPassword: async input => input.password === 'valid-password'
    ? { data: { user: admin }, error: null }
    : { error: { status: 400, code: 'invalid_credentials' } } } });
  const result = createApp({ env, db, newAuthClient,
    publish: (event, payload) => state.events.push({ event, payload: structuredClone(payload) }) });
  return { ...result, db, state };
}

test('HTTP: autenticación, permisos y validaciones', async () => {
  const { app, auth, state } = fixture();
  const adminToken = auth.sign(admin);
  const nurseToken = auth.sign(nurse);
  await request(app).get('/health').expect(200);
  await request(app).get('/health/ready').expect(200);
  await request(app).get('/api/pacientes').expect(401);
  await request(app).get('/api/auth/me').set('Authorization', 'Bearer fake').expect(401);
  await request(app).get('/health').set('Origin', 'https://intruso.example').expect(403);
  const login = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'valid-password' }).expect(200);
  assert.equal(login.body.rol, 'Administrador');
  await request(app).post('/api/auth/login').send({ email: admin.email, password: 'incorrecta' }).expect(401);
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`).expect(200);
  for (const path of ['/auth/register', '/areas', '/camas', '/pacientes']) {
    await request(app).post(`/api${path}`).set('Authorization', `Bearer ${nurseToken}`).send({}).expect(403);
  }
  await request(app).post('/api/auth/register').set('Authorization', `Bearer ${adminToken}`)
    .send({ email: 'new@hospital.com', password: 'long-password-123', rol: 'Generico' }).expect(201);
  await request(app).post('/api/areas').set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Área', tipo: 'Habitacion', coord_x: 'infinito', coord_y: 0 }).expect(400);
  await request(app).put('/api/pacientes/1').set('Authorization', `Bearer ${nurseToken}`)
    .send({ cama_id: null, enfermero_id: null, rol: 'Administrador' }).expect(200);
  assert.deepEqual(state.mutations.at(-1).input, { cama_id: null, enfermero_id: null });
  await request(app).put('/api/pacientes/1').set('Authorization', `Bearer ${nurseToken}`).send({}).expect(400);
  await request(app).get('/api/llamados?fecha_desde=2026-09-15').set('Authorization', `Bearer ${nurseToken}`).expect(400);
  await request(app).get('/api/llamados?fecha_desde=2026-09-15T00:00:00Z&fecha_hasta=2026-09-14T00:00:00Z')
    .set('Authorization', `Bearer ${nurseToken}`).expect(400);
  const expired = jwt.sign({}, env.jwtSecret, { subject: admin.id, issuer: 'codigo-azul', audience: 'hospital', expiresIn: -1 });
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`).expect(401);
  state.profiles = state.profiles.map(p => p.id === admin.id ? { ...p, rol: 'Generico' } : p);
  await request(app).post('/api/areas').set('Authorization', `Bearer ${adminToken}`).send({}).expect(403);
});

test('HTTP: contrato del frontend, dimensiones, enfermero y directorio protegido', async () => {
  const { app, auth, state } = fixture();
  const adminHeader = { Authorization: `Bearer ${auth.sign(admin)}` };
  const nurseHeader = { Authorization: `Bearer ${auth.sign(nurse)}` };
  const area = await request(app).post('/api/areas').set(adminHeader).send({
    nombre: 'Enfermería', tipo: 'Enfermeria', coordenadas_x: 82, coordenadas_y: 17, ancho: 20, alto: 20
  }).expect(201);
  assert.equal(area.body.coordenadas_x, 82);
  assert.equal(area.body.alto, 20);
  assert.deepEqual(state.mutations.at(-1).input, {
    nombre: 'Enfermería', tipo: 'Enfermeria', coord_x: 82, coord_y: 17, ancho: 20, alto: 20
  });
  await request(app).put('/api/areas/1').set(adminHeader).send({ ancho: 25, alto: 22 }).expect(200);
  assert.deepEqual(state.mutations.at(-1).input, { ancho: 25, alto: 22 });
  const invalid = await request(app).put('/api/areas/1').set(adminHeader).send({ ancho: -1 }).expect(400);
  assert.equal(invalid.body.details[0].field, 'ancho');
  assert.ok(invalid.body.details[0].message);
  await request(app).put('/api/areas/1').set(adminHeader)
    .send({ coordenadas_x: 10, coord_x: 20 }).expect(400);
  const patient = await request(app).put('/api/pacientes/1').set(nurseHeader)
    .send({ enfermero_asignado_id: nurse.id }).expect(200);
  assert.equal(patient.body.enfermero_asignado_id, nurse.id);
  assert.deepEqual(state.mutations.at(-1).input, { enfermero_id: nurse.id });
  await request(app).put('/api/pacientes/1').set(nurseHeader)
    .send({ enfermero_asignado_id: null }).expect(200);
  assert.deepEqual(state.mutations.at(-1).input, { enfermero_id: null });
  const users = await request(app).get('/api/usuarios?page=1&limit=1').set(adminHeader).expect(200);
  assert.equal(users.body.data.length, 1);
  assert.equal(users.body.data[0].email, admin.email);
  await request(app).get('/api/usuarios').set(nurseHeader).expect(403);
  await request(app).get('/api/usuarios').expect(401);
});

test('HTTP: Baño en llamadas y filtros, aliases en eventos y fechas', async () => {
  const { app, auth, state } = fixture();
  const header = { Authorization: `Bearer ${auth.sign(nurse)}` };
  const created = await request(app).post('/api/llamados/crear').set(header)
    .send({ paciente_id: 1, area_id: 1, origen: 'Baño', tipo: 'Emergencia' }).expect(201);
  assert.equal(state.calls[0].origen, 'Bano');
  assert.equal(created.body.origen, 'Baño');
  assert.equal(created.body.fecha_hora_activacion, created.body.fecha_activacion);
  assert.equal(state.events[0].payload.origen, 'Baño');
  const listed = await request(app).get('/api/llamados').query({ origen: 'Baño' }).set(header).expect(200);
  assert.equal(listed.body.data.length, 1);
  assert.equal(listed.body.data[0].origen, 'Baño');
  const attended = await request(app).put('/api/llamados/1/atender').set(header).expect(200);
  assert.equal(attended.body.tiempo_respuesta_segundos, 15);
  assert.equal(state.events.find(event => event.event === 'llamadoAtendido').payload.tiempo_respuesta_segundos, 15);
});

test('HTTP: flujo de emergencia y eventos después de guardar', async () => {
  const { app, auth, state } = fixture();
  const token = auth.sign(nurse);
  const header = { Authorization: `Bearer ${token}` };
  await request(app).post('/api/llamados/crear').set(header)
    .send({ paciente_id: 1, area_id: 1, origen: 'Cama', tipo: 'Emergencia' }).expect(201);
  assert.deepEqual(state.events.map(e => e.event), ['nuevoLlamado', 'codigoAzul', 'logSistema']);
  assert.ok(state.events[0].payload.timestamp);
  await request(app).put('/api/llamados/1/atender').set(header).send({ enfermero_id: admin.id }).expect(200);
  assert.equal(state.events.find(e => e.event === 'llamadoAtendido').payload.enfermero.id, nurse.id);
  await request(app).put('/api/llamados/1/atender').set(header).expect(409);
  assert.equal(state.events.filter(e => e.event === 'llamadoAtendido').length, 1);
  const active = await request(app).get('/api/llamados/activos').set(header).expect(200);
  assert.equal(active.body.data.length, 0);
  await request(app).get('/api/reportes/export/csv').set(header).expect(200).expect('Content-Type', /text\/csv/);
  await request(app).get('/api/reportes/export/pdf').set(header).expect(200).expect('Content-Type', /application\/pdf/);
});

test('exportaciones sin truncamiento, CSV seguro y PDF vacío válido', async () => {
  const { db, state } = fixture();
  state.calls = Array.from({ length: 7 }, (_, i) => ({ id: i + 1 }));
  assert.equal((await allLlamados(db, {})).length, 7);
  const csv = createCsv([{ id: 1, paciente: { nombre: '=HYPERLINK("https://example.com")' }, tiempo_respuesta_seg: 0 }]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(createCsv([]).includes('fecha_activacion'));
  assert.equal((await createPdf([])).subarray(0, 5).toString(), '%PDF-');
  for (const code of ['23503', '23001']) {
    assert.throws(() => dbResult({ error: { code } }), { status: 409 });
  }
});

test('HTTP: CRUD, filtros y llamado normal', async () => {
  const { app, auth, state } = fixture();
  const header = { Authorization: `Bearer ${auth.sign(admin)}` };
  for (const [resource, body] of [
    ['areas', { nombre: 'Habitación', tipo: 'Habitacion', coord_x: 0, coord_y: 1 }],
    ['camas', { nombre: 'Cama', area_id: 1, coord_x: 0, coord_y: 1 }],
    ['pacientes', { nombre: 'Paciente', dni: '12345678', area_id: 1 }]
  ]) {
    await request(app).get(`/api/${resource}?page=1&limit=10`).set(header).expect(200);
    await request(app).post(`/api/${resource}`).set(header).send(body).expect(201);
    await request(app).put(`/api/${resource}/1`).set(header).send({ nombre: 'Otro' }).expect(200);
    await request(app).delete(`/api/${resource}/1`).set(header).expect(204);
  }
  await request(app).get('/api/pacientes?area=1&enfermero=' + nurse.id).set(header).expect(200);
  await request(app).post('/api/llamados/crear').set(header)
    .send({ paciente_id: 1, area_id: 1, origen: 'Cama', tipo: 'Normal' }).expect(201);
  assert.ok(!state.events.some(e => e.event === 'codigoAzul'));
  const response = await request(app).get('/api/llamados?tipo=Normal&estado=No%20Atendido')
    .set(header).expect(200);
  assert.equal(response.body.data.length, 1);
  await request(app).get('/api/reportes/estadisticas').set(header).expect(200);
});

test('Socket.IO: rechaza anónimos y autoriza room hospital', { timeout: 10000 }, async t => {
  const { app, auth } = fixture();
  const server = createServer(app);
  const io = configureSockets(server, env, auth);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => io.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const anonymous = connect(url, { reconnection: false });
  t.after(() => anonymous.close());
  const [error] = await once(anonymous, 'connect_error');
  assert.equal(error.message, 'No autorizado');
  const client = connect(url, { auth: { token: auth.sign(nurse) }, reconnection: false });
  t.after(() => client.close());
  await once(client, 'connect');
  assert.equal(io.sockets.adapter.rooms.get('hospital').size, 1);
  const event = once(client, 'codigoAzul');
  io.to('hospital').emit('codigoAzul', { id: 42 });
  assert.equal((await event)[0].id, 42);
});
~~~~

## backend/test/env.test.js

~~~~javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readEnv, envPath } from '../src/config/env.js';

const valid = {
  SUPABASE_URL: 'https://test-project.supabase.co',
  SUPABASE_KEY: 'test-server-key',
  JWT_SECRET: 'test-secret-with-more-than-32-characters',
  FRONTEND_URL: 'http://localhost:5173,http://127.0.0.1:5173'
};

test('configuración se resuelve desde backend independientemente del cwd', () => {
  assert.equal(envPath, fileURLToPath(new URL('../.env', import.meta.url)));
  const config = readEnv(valid);
  assert.deepEqual(config.origins, ['http://localhost:5173', 'http://127.0.0.1:5173']);
  assert.equal(config.port, 3000);
});

test('configuración rechaza ejemplos, secretos vacíos, puertos y orígenes inválidos', () => {
  for (const override of [
    { SUPABASE_URL: '' }, { SUPABASE_URL: 'https://TU_PROYECTO.supabase.co' },
    { SUPABASE_KEY: 'TU_CLAVE_SECRETA_DE_SUPABASE' }, { JWT_SECRET: 'short' },
    { PORT: '70000' }, { TRUST_PROXY: '2' }, { FRONTEND_URL: 'file:///tmp' },
    { FRONTEND_URL: 'https://hospital.test/dashboard' }
  ]) assert.throws(() => readEnv({ ...valid, ...override }));
});
~~~~

## backend/test/migration.test.js

~~~~javascript
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
~~~~

## backend/test/schema.test.js

~~~~javascript
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
~~~~

## backend/test/server.test.js

~~~~javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

test('servidor real inicia desde la raíz y se detiene liberando el puerto', { timeout: 15000 }, async t => {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = fork(fileURLToPath(new URL('../src/server.js', import.meta.url)), [], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: {
      ...process.env, SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_KEY: 'local-test-key', JWT_SECRET: 'local-test-secret-longer-than-32-characters',
      FRONTEND_URL: 'http://localhost:5173', PORT: String(port), TRUST_PROXY: '0'
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  await Promise.race([
    once(child, 'message'),
    once(child, 'exit').then(([code]) => { throw new Error(`Salida prematura ${code}: ${stderr}`); })
  ]);
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  assert.deepEqual(await response.json(), { status: 'ok' });
  const protectedResponse = await fetch(`http://127.0.0.1:${port}/api/pacientes`);
  assert.equal(protectedResponse.status, 401);
  const stopped = once(child, 'exit');
  child.send({ type: 'shutdown' });
  const [code] = await stopped;
  assert.equal(code, 0, stderr);
  const probe = createServer();
  t.after(() => probe.close());
  probe.listen(port, '127.0.0.1');
  await once(probe, 'listening');
});
~~~~

## backend/scripts/check-backend.mjs

~~~~javascript
import { readEnv } from '../src/config/env.js';
import { createSupabase } from '../src/config/supabase.js';
import { dbResult } from '../src/utils/errors.js';

export async function checkBackend() {
  const env = readEnv();
  const { db } = createSupabase(env);
  for (const [table, columns] of [
    ['perfiles', 'id,email,rol'],
    ['areas', 'id,nombre,tipo,coord_x,coord_y,ancho,alto'],
    ['camas', 'id,area_id,nombre,coord_x,coord_y'],
    ['pacientes', 'id,nombre,dni,datos_medicos,cama_id,area_id,enfermero_id'],
    ['llamados', 'id,paciente_id,area_id,origen,tipo,estado,fecha_activacion,fecha_atencion,tiempo_respuesta_seg,cama_id,enfermero_atencion_id']
  ]) {
    dbResult(await db.from(table).select(columns).limit(1));
    console.log(`OK tabla ${table}`);
  }
  dbResult(await db.rpc('estadisticas_llamados', {}));
  console.log('OK función de estadísticas');
  const users = dbResult(await db.from('perfiles').select('id,email,rol').eq('rol', 'Administrador').limit(1));
  if (!users.length) throw new Error('Falta un perfil Administrador. Seguir backend/README.md para crear el primer usuario.');
  console.log('OK perfil administrador disponible');
  return { env, profile: users[0] };
}

if (process.argv[1] && new URL(import.meta.url).pathname.endsWith('/' + process.argv[1].replaceAll('\\', '/').split('/').at(-1))) {
  checkBackend().catch(error => { console.error(error.message); process.exitCode = 1; });
}
~~~~

## backend/scripts/export-code.mjs

~~~~javascript
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['package.json', '.env.example', 'README.md'];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (['.js', '.mjs', '.sql'].includes(extname(entry.name))) {
      files.push(relative(root, path).replaceAll('\\', '/'));
    }
  }
}
for (const directory of ['src', 'supabase', 'test', 'scripts']) await walk(resolve(root, directory));
const formats = { '.js': 'javascript', '.mjs': 'javascript', '.json': 'json', '.sql': 'sql', '.md': 'markdown' };
const sections = ['# Código Azul — Código completo del backend\n\nArchivos relativos a la raíz del repositorio. Las credenciales locales no se incluyen.\n'];
for (const path of files) {
  const content = await readFile(resolve(root, path), 'utf8');
  sections.push(`## backend/${path}\n\n~~~~${formats[extname(path)] || 'text'}\n${content.trimEnd()}\n~~~~\n`);
}
await writeFile(resolve(root, '../CODIGO_COMPLETO.md'), sections.join('\n'), 'utf8');
console.log(`Código exportado: ${files.length} archivos.`);
~~~~

## backend/scripts/smoke.mjs

~~~~javascript
// Verificación de lectura contra el backend real; nunca modifica datos clínicos.
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { checkBackend } from './check-backend.mjs';

let child;
let socket;
try {
  const { env, profile } = await checkBackend();
  child = fork(fileURLToPath(new URL('../src/server.js', import.meta.url)), [], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('El servidor no inició en 20 segundos.')), 20000);
    child.once('message', message => { if (message.type === 'ready') { clearTimeout(timer); resolve(); } });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`El servidor terminó antes de estar listo (código ${code}).`)); });
    child.once('error', error => { clearTimeout(timer); reject(error); });
  });
  const token = jwt.sign({ rol: profile.rol }, env.jwtSecret, {
    issuer: 'codigo-azul', audience: 'hospital', subject: profile.id, algorithm: 'HS256', expiresIn: '2m'
  });
  const base = `http://127.0.0.1:${env.port}`;
  for (const path of [
    '/health', '/health/ready', '/api/auth/me', '/api/usuarios', '/api/areas', '/api/camas',
    '/api/pacientes', '/api/llamados/activos', '/api/llamados?origen=Ba%C3%B1o',
    '/api/reportes/estadisticas', '/api/reportes/export/csv', '/api/reportes/export/pdf'
  ]) {
    const response = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(`${path}: HTTP ${response.status} ${data.error || ''}`);
    }
    await response.arrayBuffer();
    console.log(`OK HTTP ${path}`);
  }
  const anonymous = await fetch(base + '/api/pacientes');
  if (anonymous.status !== 401) throw new Error('El acceso sin token no fue rechazado.');
  console.log('OK rechazo de acceso anónimo');
  socket = io(base, { auth: { token }, reconnection: false, timeout: 10000 });
  await Promise.race([
    once(socket, 'connect'),
    once(socket, 'connect_error').then(([error]) => { throw error; })
  ]);
  console.log('OK Socket.IO autenticado');
  console.log('Verificación real completada. No se modificaron registros.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  socket?.disconnect();
  if (child?.connected) {
    const stopped = once(child, 'exit');
    child.send({ type: 'shutdown' });
    const timeout = setTimeout(() => child.kill(), 12000);
    await stopped;
    clearTimeout(timeout);
  }
}
~~~~
