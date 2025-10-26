import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: path.join('src', 'lib', 'prisma', 'schema'),
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: { path: path.join('src', 'lib', 'prisma', 'migrations') },
});
