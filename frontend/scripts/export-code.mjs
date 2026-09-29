import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const order = ['package.json', '.env.example', 'index.html', 'src/main.jsx', 'src/index.css', 'src/App.jsx', 'src/App.css',
  'src/services/api.js', 'src/services/socket.js', 'src/context/AuthContext.jsx', 'src/context/SocketContext.jsx',
  'src/hooks/useAuth.js', 'src/hooks/useSocket.js', 'src/utils/formateoFechas.js', 'src/utils/constantes.js'];
for (const name of ['ProtectedRoute', 'Layout', 'Sidebar', 'Modal', 'Avatar', 'AreaMapa', 'MapaHospital', 'Consola', 'TablaGenerica', 'GraficoBarras', 'GraficoPastel', 'GraficoLineas']) {
  order.push(`src/components/${name}.jsx`);
  if (!['ProtectedRoute', 'GraficoBarras', 'GraficoPastel', 'GraficoLineas'].includes(name)) order.push(`src/components/${name}.module.css`);
}
for (const name of ['Login', 'Dashboard', 'Pacientes', 'Areas', 'Usuarios', 'Reportes']) order.push(`src/pages/${name}.jsx`, `src/pages/${name}.module.css`);
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'assets') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(relative(root, path).replaceAll('\\', '/'));
  }
  return result;
}
for (const directory of ['src', 'tests', 'scripts']) order.push(...await walk(resolve(root, directory)));
order.push('vite.config.js', 'eslint.config.js', 'playwright.config.js', 'vercel.json', '.gitignore', 'README.md');
const fences = { '.js': 'javascript', '.mjs': 'javascript', '.jsx': 'jsx', '.css': 'css', '.json': 'json', '.html': 'html', '.md': 'markdown' };
const sections = [];
for (const path of new Set(order)) {
  const content = await readFile(resolve(root, path), 'utf8');
  sections.push(`## ${path}\n\n~~~~${fences[extname(path)] || 'text'}\n${content.trimEnd()}\n~~~~\n`);
}
await writeFile(resolve(root, 'CODIGO_FRONTEND.md'), sections.join('\n'), 'utf8');
console.log('CODIGO_FRONTEND.md generado con ' + sections.length + ' archivos.');

