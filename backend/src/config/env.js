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
