import { io, Socket } from 'socket.io-client';
import get from 'lodash/get';
import set from 'lodash/set';

const SET_SOCKET_IO_CLIENT = '__socketIOClient__';

const getSocketClient = (): Socket => {
  const globalAny: any = globalThis as any;
  let client = get(globalAny, SET_SOCKET_IO_CLIENT);
  if (client) return client;
  const newClient = io('http://localhost:4000', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  set(globalAny, SET_SOCKET_IO_CLIENT, newClient);
  return newClient;
};

export const socketIO = getSocketClient();

// Log socket events
socketIO.on('connect', () => {
  console.log('🔌 Socket đã kết nối, ID:', socketIO.id);
});

socketIO.on('connect_error', (error) => {
  console.error('❌ Socket kết nối thất bại:', error);
});

socketIO.on('disconnect', (reason) => {
  console.log('🔌 Socket bị ngắt kết nối:', reason);
});

export default socketIO;
