import * as dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

import path from 'node:path';
import fs from 'node:fs/promises';
import { defineConfig, env as prismaEnv } from 'prisma/config';

const listFiles = async (): Promise<string[]> => {
  const basePath = path.resolve(process.cwd());
  const envFiles = await fs
    .readdir(basePath)
    .then((files) => files.filter((file) => file.startsWith('.env')))
    .then((files) =>
      files.sort((a, b) => {
        // .env.local should override .env
        if (a === '.env') return -1;
        if (b === '.env') return 1;
        return a.localeCompare(b);
      }),
    );
  return envFiles;
};

const envFiles = await listFiles();
const env = dotenv.config({ override: true, path: envFiles });
dotenvExpand.expand(env);

export default defineConfig({
  schema: path.join('src', 'lib', 'prisma', 'schema'),
  datasource: {
    url: prismaEnv('DATABASE_URL'),
  },
  migrations: { path: path.join('src', 'lib', 'prisma', 'migrations') },
});
