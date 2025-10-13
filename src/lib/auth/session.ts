import { AuthClaims, ZAuthClaims } from '@/contracts/auth';
import * as jose from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? 'dev-secret');

export async function verifyToken(token: string) {
  const { payload } = await jose.jwtVerify(token, SECRET);
  const parsed = ZAuthClaims.parse(payload);
  return parsed;
}

export async function generateToken(claims: AuthClaims) {
  const payload = ZAuthClaims.parse(claims);
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
  return token;
}
