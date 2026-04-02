import type { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../socket';

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (req.method !== 'POST') return res.end();
  
  // Basic security to ensure it's called server-to-server locally
  // However, since it's just broadcasting events for the UI, keeping it simple is fine
  const { event, room, payload } = req.body;
  if (!event || !room) return res.status(400).end();

  res.socket.server.io?.to(room).emit(event, payload);
  res.end();
}
