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
