import 'server-only';

import { z } from 'zod';

const ZAppEnv = z.enum(['development', 'production', 'test'], 'Invalid app environment');
const ZServerConfig = z.object({
  appEnv: ZAppEnv.default('development'),
  port: z.number().min(1).max(65535, 'Port must be between 1 and 65535').default(3000),
  host: z.string().min(1, 'Host is required'),

  db: z.object({ url: z.string() }),
  auth: z.object({
    secret: z.string().min(32, 'Auth secret must be at least 32 characters long'),

    cerbosApiURL: z.url(),
    openFGAApiURL: z.url(),
  }),
  s3: z.object({
    bucketName: z.string().min(1, 'S3 bucket name is required'),
    apiURL: z.url().optional(),
  }),
});

export type ServerConfig = z.infer<typeof ZServerConfig>;

export const serverConfig = ZServerConfig.parse({
  appEnv: process.env.APP_ENV,
  port: process.env.PORT ? Number(process.env.PORT) : undefined,
  host: process.env.HOST || 'localhost',

  db: { url: process.env.DATABASE_URL },
  auth: { secret: process.env.AUTH_SECRET },
});

export default serverConfig;
