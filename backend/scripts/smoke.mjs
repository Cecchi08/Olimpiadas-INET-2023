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

