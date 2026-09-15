import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export function readEnv(source = process.env) {
  for (const key of ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET', 'FRONTEND_URL']) {
    if (!source[key]?.trim()) throw new Error(`Falta la variable ${key}`);
  }
  const url = new URL(source.SUPABASE_URL);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('SUPABASE_URL inválida');
  if (source.JWT_SECRET.length < 32 || source.JWT_SECRET.startsWith('REEMPLAZAR')) {
    throw new Error('JWT_SECRET debe ser aleatorio y tener al menos 32 caracteres');
  }
  const origins = source.FRONTEND_URL.split(',').map(value => new URL(value.trim()).origin);
  const port = Number(source.PORT || 3000);
  const trustProxy = Number(source.TRUST_PROXY || 0);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválido');
  if (![0, 1].includes(trustProxy)) throw new Error('TRUST_PROXY debe ser 0 o 1');
  return {
    supabaseUrl: url.href, supabaseKey: source.SUPABASE_KEY,
    jwtSecret: source.JWT_SECRET, origins, port, trustProxy
  };
}
