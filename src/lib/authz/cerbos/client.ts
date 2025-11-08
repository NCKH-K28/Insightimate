import z from 'zod';
import { HTTP } from '@cerbos/http';

const ZCerbosConfig = z.object({ CERBOS_API_URL: z.url() });
const cerbosConfig = ZCerbosConfig.parse(process.env);

// == Cerbos Client

const globalForCerbos = globalThis as unknown as { cerbos: HTTP | undefined };
if (!globalForCerbos.cerbos) globalForCerbos.cerbos = new HTTP(cerbosConfig.CERBOS_API_URL);
export const cerbosEdge = globalForCerbos.cerbos;

// // == Health Check
await cerbosEdge.checkHealth().catch((err) => {
  console.error('Cerbos health check failed:', err);
  process.exit(1);
});
