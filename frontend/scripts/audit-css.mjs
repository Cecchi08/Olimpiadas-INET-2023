import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: path.dirname(fileURLToPath(import.meta.url)), encoding: 'utf8',
}).trim();
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
const committed = new Set(git('ls-tree', '-r', '--name-only', '-z', 'HEAD').split('\0'));
const trackedSet = new Set(tracked);
const files = [];
function walk(directory) {
  for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const name = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walk(name);
    else files.push(name);
  }
}
walk('frontend/src');
const disk = new Set(files);
const cssFiles = files.filter(file => /\.css$/i.test(file));
let failures = 0;
let imports = 0;
function fail(message) { failures++; console.error(message); }

for (const file of cssFiles) {
  if (!trackedSet.has(file)) {
    const match = tracked.find(name => name.toLowerCase() === file.toLowerCase());
    fail(match ? `CASE EN GIT: ${file} -> ${match}` : `CSS SIN SEGUIMIENTO: ${file}`);
  }
  if (!committed.has(file)) fail(`CSS AUSENTE DE HEAD: ${file}`);
}

for (const file of files.filter(name => /\.[cm]?[jt]sx?$/.test(name))) {
  const source = readFileSync(path.join(root, file), 'utf8');
  const pattern = /\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) {
    const specifier = match[1] || match[2];
    if (specifier.includes('\\')) fail(`BACKSLASH: ${file}: ${specifier}`);
    if (!specifier.startsWith('.') || !/\.css(?:[?#]|$)/i.test(specifier)) continue;
    imports++;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier.split(/[?#]/)[0]));
    if (!disk.has(target)) {
      const actual = files.find(name => name.toLowerCase() === target.toLowerCase());
      fail(actual ? `CASE EN IMPORT: ${file}: ${specifier} -> ${actual}` : `CSS INEXISTENTE: ${file}: ${specifier}`);
    }
    if (!trackedSet.has(target)) fail(`IMPORT NO COINCIDE CON GIT: ${file}: ${specifier}`);
  }
}

const ignored = spawnSync('git', ['check-ignore', '--no-index', '-v', '--stdin'], {
  cwd: root, encoding: 'utf8', input: cssFiles.join('\n') + '\n',
});
if (ignored.error) throw ignored.error;
if (ignored.status !== 0 && ignored.status !== 1) throw new Error(ignored.stderr);
if (ignored.stdout.trim()) console.log('REGLAS .gitignore ("!" significa inclusion):\n' + ignored.stdout.trim());
else console.log('Ninguna regla .gitignore coincide con los CSS.');

console.log(`${cssFiles.length} CSS, ${cssFiles.filter(file => /\.module\.css$/.test(file)).length} CSS Modules, ${imports} imports CSS; ${failures} problemas de rutas/seguimiento.`);
const changes = git('diff', 'HEAD', '--name-only', '--', 'frontend/src').trim();
if (changes) console.log('CAMBIOS LOCALES NO COMMITTEADOS:\n' + changes);
process.exitCode = failures ? 1 : 0;
