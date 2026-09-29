import { io } from 'socket.io-client';
export function crearSocket(token) {
  return io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', { auth: { token }, autoConnect: true });
}

