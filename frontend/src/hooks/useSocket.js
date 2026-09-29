import { useContext } from 'react';
import { SocketContext } from '../context/contexts';
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket requiere SocketProvider');
  return context;
}

