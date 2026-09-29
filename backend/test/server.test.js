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
