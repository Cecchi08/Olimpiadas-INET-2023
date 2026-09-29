import { Server } from 'socket.io';

export function configureSockets(server, env, auth) {
  const io = new Server(server, {
    cors: { origin: env.origins, methods: ['GET', 'POST'] },
    allowRequest: (req, callback) => callback(null, !req.headers.origin || env.origins.includes(req.headers.origin))
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') throw new Error();
      socket.data.user = await auth.authenticate(token);
      next();
    } catch { next(new Error('No autorizado')); }
  });
  io.on('connection', socket => {
    socket.join('hospital');
    socket.emit('logSistema', 'Conectado al sistema Código Azul.');
    const expiry = setTimeout(() => socket.disconnect(true),
      Math.max(0, socket.data.user.exp * 1000 - Date.now()));
    expiry.unref();
    let checking = false;
    const check = setInterval(async () => {
      if (checking) return;
      checking = true;
      try { await auth.authenticate(socket.handshake.auth.token); }
      catch { socket.disconnect(true); }
      finally { checking = false; }
    }, 30000);
    check.unref();
    socket.on('disconnect', () => { clearTimeout(expiry); clearInterval(check); });
  });
  return io;
}
