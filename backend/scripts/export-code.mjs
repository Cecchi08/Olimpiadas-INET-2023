import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const formats = { '.js': 'javascript', '.mjs': 'javascript', '.jsx': 'jsx', '.css': 'css', '.json': 'json', '.sql': 'sql', '.md': 'markdown', '.html': 'html' };
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'assets') continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (formats[extname(path)]) files.push(path);
  }
  return files.sort();
}

// Ordenar imports locales para que cada componente aparezca tras sus dependencias.
async function dependencyOrder(files) {
  const known = new Set(files), visited = new Set(), ordered = [];
  async function visit(path) {
    if (visited.has(path)) return;
    visited.add(path);
    const source = await readFile(resolve(root, path), 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
      const base = relative(root, resolve(root, dirname(path), match[1])).replaceAll('\\', '/');
      const target = [base, `${base}.js`, `${base}.jsx`].find(candidate => known.has(candidate));
      if (target) await visit(target);
    }
    ordered.push(path);
  }
  for (const file of files) await visit(file);
  return ordered;
}

const backend = ['backend/package.json', 'backend/.env.example',
  ...await dependencyOrder(await walk('backend/src')), ...await walk('backend/scripts'), ...await walk('backend/test')];
const frontend = ['frontend/package.json', 'frontend/.env.example', 'frontend/index.html',
  ...await dependencyOrder(await walk('frontend/src')), ...await walk('frontend/tests'), ...await walk('frontend/scripts'),
  'frontend/vite.config.js', 'frontend/eslint.config.js', 'frontend/playwright.config.js', 'frontend/vercel.json'];
const sql = await walk('backend/supabase');
const demo = 'backend/supabase/migrations/20260930140537_demo_codigo_azul.sql';
const files = [...backend, ...frontend, 'README.md', 'backend/README.md', 'frontend/README.md', 'DEMO.md',
  ...sql.filter(path => path !== demo), demo];
const sections = ['# Código Azul — Entrega completa\n\nBackend, frontend en orden de dependencia, instrucciones de prueba y SQL al final. Cada título indica el archivo completo relativo a la raíz. Los archivos .env reales y las imágenes existentes no se incluyen. Los package-lock.json permanecen en el repositorio. En una base existente ejecutar solamente la migración del demo indicada en DEMO.md, no concatenar todos los SQL.\n'];
for (const path of new Set(files)) {
  const content = await readFile(resolve(root, path), 'utf8');
  sections.push(`## ${path}\n\n~~~~~~~~${formats[extname(path)] || 'text'}\n${content.trimEnd()}\n~~~~~~~~\n`);
}
await writeFile(resolve(root, 'CODIGO_COMPLETO.md'), sections.join('\n'), 'utf8');
console.log(`CODIGO_COMPLETO.md: ${new Set(files).size} archivos completos.`);

// Entrega de implementación: SQL previo y archivos completos, sin documentación intercalada.
let tracked;
try {
  tracked = new Set(execFileSync('git', ['ls-files', '--cached', '-z'], {
    cwd: root, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore']
  }).split('\0'));
} catch {
  console.warn('Sin metadatos Git: se omite únicamente la etiqueta de archivo nuevo.');
}
function groupOrder(paths, groups) {
  const rank = path => {
    const index = groups.findIndex(group => path.startsWith(group));
    return index < 0 ? groups.length : index;
  };
  return [...paths].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
const delivery = [demo,
  ...groupOrder(backend, ['backend/src/config/', 'backend/src/controllers/', 'backend/src/routes/',
    'backend/src/sockets/', 'backend/src/server.js', 'backend/src/']),
  ...groupOrder(frontend, ['frontend/src/services/', 'frontend/src/context/', 'frontend/src/hooks/',
    'frontend/src/components/', 'frontend/src/pages/', 'frontend/src/'])];
const code = [];
for (const path of new Set(delivery)) {
  const content = await readFile(resolve(root, path), 'utf8');
  const title = `${tracked?.has(path) !== false ? '// ' : '// NUEVO ARCHIVO: '}${path}`;
  const prerequisite = path === demo
    ? '-- Ejecutar sobre la base existente solamente si faltan los campos o las funciones del demo.\n-- No se modificó la base remota en esta entrega. Falta configurar un perfil Administrador (backend/README.md).\n'
    : '';
  code.push(`## ${title}\n\n~~~~~~~~${formats[extname(path)] || 'text'}\n${prerequisite}${content.trimEnd()}\n~~~~~~~~\n`);
}
code.push('## CÓMO LEVANTAR EL PROYECTO\n\n```powershell\n# Node.js 24; backend/.env configurado; perfil Administrador en Supabase.\nnpm --prefix backend ci; npm --prefix backend run dev\n# Otra terminal:\nnpm --prefix frontend ci; npm --prefix frontend run dev\n```\n');
await writeFile(resolve(root, 'ENTREGA.md'), code.join('\n'), 'utf8');
console.log(`ENTREGA.md: ${new Set(delivery).size} archivos completos.`);
