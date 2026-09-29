# Código Azul

Sistema de gestión hospitalaria con frontend React y backend Express/Socket.IO conectado a Supabase.

```text
frontend/          Aplicación React, recursos y pruebas de navegador
backend/           API, configuración, SQL, dependencias y pruebas del servidor
.gitignore
README.md
CODIGO_COMPLETO.md Código completo del backend
```

## Ejecutar el backend

Requiere Node.js 24. Desde la raíz:

```powershell
cd backend
npm ci
# Solo para una instalación nueva:
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run check
npm run dev
```

Completar `backend/.env` con SUPABASE_URL, SUPABASE_KEY, JWT_SECRET y FRONTEND_URL. El archivo de configuración anterior se trasladó a esa ubicación; no reemplazarlo con el ejemplo si ya contiene credenciales.

Instalación inicial y actualización del esquema: [backend/README.md](backend/README.md). La API escucha en http://localhost:3000 por defecto. Ctrl+C la detiene.

## Ejecutar el frontend

En otra terminal, desde la raíz:

```powershell
cd frontend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Abrir http://localhost:5173. Ver [frontend/README.md](frontend/README.md) para variables, recursos gráficos y Vercel.

## Verificar

```powershell
npm --prefix backend test
npm --prefix backend run check
npm --prefix backend run smoke
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
```

Las pruebas automáticas del backend usan PostgreSQL local aislado y no requieren credenciales. `check` y `smoke` requieren Supabase configurado; smoke inicia el servidor, realiza comprobaciones de lectura y lo deja detenido. El diagnóstico de lectura no reemplaza una prueba manual de login con una cuenta real.

En Render configurar **Root Directory: backend**. En Vercel configurar **Root Directory: frontend**.
