import 'server-only';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const ROOT_DIR: string = require.resolve('@/../');
