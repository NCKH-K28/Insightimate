import serverConfig from '@/configs/server';
import { AuthClaims, ZAuthClaims } from '@/contracts/auth';
import * as jose from 'jose';

const authConfig = serverConfig.auth;
const secret = new TextEncoder().encode(authConfig.secret);

export async function verifyToken(token: string) {
  const { payload } = await jose.jwtVerify(token, secret);
  const parsed = ZAuthClaims.parse(payload);
  return parsed;
}

export async function generateToken(claims: AuthClaims) {
  const payload = ZAuthClaims.parse(claims);
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  return token;
}
