import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { NextApiResponse } from 'next';
import { Server as IOServer } from 'socket.io';
import type { NextApiRequest } from 'next';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & { server: HTTPServer & { io?: IOServer } };
};

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: '/api/socket',
      cors: { origin: '*' },
      addTrailingSlash: false,
    });

    res.socket.server.io = io;
    io.on('connection', (socket) => {
      socket.on('thread:join', (threadId: string) => {
        socket.join(`thread:${threadId}`);
      });

      socket.on('thread:leave', (threadId: string) => {
        socket.leave(`thread:${threadId}`);
      });
    });
  }

  res.end();
}
