# Código Azul — Frontend

React + Vite, JavaScript, React Router DOM v6, Context API, Axios, Socket.IO, Recharts, Framer Motion y CSS Modules.

## Inicio

Desde la raíz del repositorio, con Node.js 24:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

En Linux/macOS: `cp .env.example .env`. Abrir http://localhost:5173. Ejecutar el backend en otra terminal con su configuración propia. No hay credenciales predeterminadas ni datos simulados en la aplicación.

```dotenv
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Usar orígenes sin el sufijo /api. Reiniciar Vite después de cambiar variables. Autorizar el origen del frontend en CORS del backend.

## Verificación

```sh
npm run lint
npm test
npm run build
npm run preview
npm run export:code
```

Build: dist/. Las pruebas usan Edge instalado, respuestas HTTP simuladas y Socket.IO real en los puertos 5179 y 3099. No requieren credenciales ni datos reales. Para Chromium, quitar `channel: 'msedge'` de playwright.config.js y ejecutar `npx playwright install chromium`. Capturas: test-results/. El último comando genera CODIGO_FRONTEND.md con los archivos completos en el orden solicitado.

## Contrato e integración

El backend de este repositorio está en `backend/` y acepta los nombres del frontend. Aplicar `backend/supabase/migrations/20260930140537_demo_codigo_azul.sql` al esquema existente. Para una base nueva, instalar primero `backend/supabase/schema.sql`. Preparación y prueba del demo: [DEMO.md](../DEMO.md).

| Recurso | Frontend | Backend |
| --- | --- | --- |
| Coordenadas | coordenadas_x, coordenadas_y | La migración normaliza PostgreSQL a estos nombres |
| Dimensiones de áreas | ancho, alto | Persistidas en PostgreSQL |
| Tipos de área | Ocho tipos | Los ocho tipos admitidos |
| Enfermero del paciente | enfermero_asignado_id | Selector cargado desde GET /api/enfermeros |
| Origen | Cama / Baño | Acepta Baño y Bano; devuelve Baño |
| Listado de perfiles | GET /api/auth/usuarios, solo admin | Listado paginado protegido |

Las escrituras mantienen el contrato solicitado. El mapa admite también coord_x/coord_y y dimensiones de referencia para áreas conocidas; la tabla muestra los datos persistidos. La lectura admite enfermero_id, fecha_activacion y tiempo_respuesta_seg como aliases.

Usuarios permite crear, cambiar rol y eliminar; Enfermeros agrega nombre, área, turno y contador de pacientes; Camas permite CRUD y filtro por área. Los enfermeros del mapa se cargan desde GET /api/enfermeros y parten de su área asignada. El servidor decide el enfermero disponible para cada simulación; las posiciones muestran la animación del demo.

Administrador y Generico pueden crear, editar y eliminar pacientes. Gestionar áreas, camas y usuarios requiere Administrador. El backend valida los permisos en cada operación.

## Endpoints

- POST /api/auth/login, GET /api/auth/me, POST /api/auth/register.
- GET/POST /api/pacientes; PUT/DELETE /api/pacientes/:id.
- GET/POST /api/areas; PUT/DELETE /api/areas/:id; GET/POST /api/camas; PUT/DELETE /api/camas/:id.
- GET /api/auth/usuarios; PUT /api/auth/usuarios/:id/rol; PUT/DELETE /api/auth/usuarios/:id; GET /api/enfermeros.
- POST /api/llamados/crear con simulacion: true desde el modal o una cama ocupada.
- GET /api/llamados/activos, GET /api/llamados, PUT /api/llamados/:id/atender.
- GET /api/reportes/estadisticas, /api/reportes/export/pdf y /api/reportes/export/csv.

Los listados admiten arrays directos o { data, total, page, limit }; se recorren todas las páginas.

## Reportes

Respuesta esperada:

```json
{
  "total_llamados": 12,
  "atendidos": 10,
  "tiempo_promedio_respuesta_seg": 24,
  "por_area": [{"nombre": "Habitación 1", "total_llamados": 12}],
  "por_tipo": [{"tipo": "Normal", "total_llamados": 9}, {"tipo": "Emergencia", "total_llamados": 3}],
  "por_dia": [{"fecha": "2026-09-29", "promedio": 24}]
}
```

Los grupos también admiten cantidad o total. Si falta por_dia, se obtiene el historial paginado y se calcula el promedio de llamados atendidos por día de activación. Las fechas abarcan el día local completo y se envían como fecha_desde/fecha_hasta ISO; otros filtros: area_id y origen. Los mismos filtros se aplican a PDF/CSV.

## Plano e imágenes

Agregar a src/assets/: recepcion.png, secretaria.png, sala_espera.png, enfermeria.png, pasillo.png, quirofano.png, bano.png, habitacion1.png y habitacion2.png. **Estos nueve archivos no estaban presentes.** Mientras falten se utilizan imágenes SVG esquemáticas generadas por código. Al agregar PNG, reconstruir el proyecto.

Las áreas y camas usan coordenadas porcentuales globales de un canvas 1920×1080. El plano mantiene relación 16:9. PLANO_REFERENCIA contiene las doce distribuciones del pedido, sin crear registros ni presentar datos ficticios.

## Sesión y eventos

El token se guarda en localStorage bajo codigoAzul.token. GET /api/auth/me valida la sesión; un 401 autenticado la cierra. El login muestra su propio error 401. Los cambios de sesión se sincronizan entre pestañas.

El socket autentica con token; el servidor incorpora la conexión a hospital y a la sala personal. Escucha nuevoLlamado, llamadoAtendido, codigoAzul, logSistema y notificacionEnfermero. Al conectar o reconectar obtiene los llamados activos y reconcilia eventos recibidos durante la consulta; también consulta cada diez segundos. La consola conserva los últimos 500 eventos. Las desconexiones marcan el estado como no sincronizado. El overlay dura tres segundos y respeta movimiento reducido. La atención automática del demo ocurre en el servidor a los treinta segundos y permanece operativa al cerrar la pestaña.

## Vercel

1. Importar el repositorio. **Root Directory: frontend**, preset **Vite**.
2. Build Command: npm run build. Output Directory: dist.
3. En **Environment Variables**, configurar **VITE_API_URL** y **VITE_SOCKET_URL** con el origen HTTPS del backend.
4. Autorizar el dominio de Vercel en FRONTEND_URL/CORS del backend.
5. Desplegar. vercel.json habilita acceso directo a rutas como /dashboard.

Las variables VITE_* son públicas y se incorporan al build. No colocar secretos del servidor.

## Dependencias

Se conserva Router v6 por requisito explícito. npm audit informa dos entradas moderadas para react-router/react-router-dom y propone actualizar a v7. La SPA usa rutas constantes y no utiliza hidratación SSR. Una actualización mayor requiere revisar el requisito de versión.

Referencias: [rutas de React Router v6](https://reactrouter.com/6.30.1/components/routes), [deploy de Vite en Vercel](https://vite.dev/guide/static-deploy.html#vercel).
