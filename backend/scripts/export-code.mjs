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

