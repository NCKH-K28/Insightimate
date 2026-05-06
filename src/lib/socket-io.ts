import { io, Socket } from 'socket.io-client';
import get from 'lodash/get';
import set from 'lodash/set';

const SET_SOCKET_IO_CLIENT = '__socketIOClient__';

const getSocketClient = (): Socket => {
  const globalAny = globalThis as unknown as { __socketIOClient__: Socket | undefined };
  const client = get(globalAny, SET_SOCKET_IO_CLIENT);
  if (client) return client;
  const newClient = io({
    path: '/api/socket',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  set(globalAny, SET_SOCKET_IO_CLIENT, newClient);
  return newClient;
};

export const socketIO = getSocketClient();

export default socketIO;
