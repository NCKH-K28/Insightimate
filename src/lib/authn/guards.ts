import serverConfig from '@/configs/server';
import { jwt } from 'hono/jwt';

const authConfig = serverConfig.auth;
export const authenticatedHono = jwt({
  secret: authConfig.secret,
  cookie: authConfig.cookieName,
  alg: 'HS256',
});
