import { createServer } from 'node:http';
import { readEnv } from './config/env.js';
import { createSupabase } from './config/supabase.js';
import { createApp } from './app.js';
import { configureSockets } from './sockets/index.js';

const env = readEnv();
const clients = createSupabase(env);
let io;
const { app, auth } = createApp({ env, ...clients,
  publish: (event, payload) => io.to('hospital').emit(event, payload) });
const server = createServer(app);
io = configureSockets(server, env, auth);
server.listen(env.port, '0.0.0.0', () => console.log(`Código Azul escuchando en puerto ${env.port}`));

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  io.close(() => { clearTimeout(timeout); process.exit(0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
