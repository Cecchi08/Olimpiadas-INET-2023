import { createServer } from 'node:http';
import { readEnv } from './config/env.js';
import { createSupabase } from './config/supabase.js';
import { createApp } from './app.js';
import { configureSockets } from './sockets/index.js';

try {
  const env = readEnv();
  const clients = createSupabase(env);
  let io;
  const { app, auth } = createApp({ env, ...clients,
    publish: (event, payload) => io.to('hospital').emit(event, payload) });
  const server = createServer(app);
  io = configureSockets(server, env, auth);
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE'
      ? `No se pudo iniciar: el puerto ${env.port} ya está ocupado.`
      : `No se pudo iniciar el servidor (${error.code || error.name}).`);
    process.exitCode = 1;
    io.close();
  });
  server.listen(env.port, '0.0.0.0', () => {
    console.log(`Código Azul escuchando en http://localhost:${env.port}`);
    process.send?.({ type: 'ready', port: env.port });
  });

  let stopping = false;
  function shutdown() {
    if (stopping) return;
    stopping = true;
    console.log('Deteniendo Código Azul…');
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    io.close(() => {
      clearTimeout(timeout);
      console.log('Backend detenido.');
      process.exit(0);
    });
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  // Canal privado disponible únicamente cuando se ejecuta con child_process.fork.
  process.on('message', message => { if (message?.type === 'shutdown') shutdown(); });
} catch (error) {
  console.error(`No se pudo iniciar Código Azul: ${error.message}`);
  process.exitCode = 1;
}
