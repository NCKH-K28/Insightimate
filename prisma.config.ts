import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('src', 'lib', 'prisma', 'schema'),
  migrations: { path: path.join('src', 'lib', 'prisma', 'migrations') },
});
