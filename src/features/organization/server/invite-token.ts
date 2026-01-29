import z from 'zod';
import * as jose from 'jose';
import serverConfig from '@/configs/server';
import { hash, compare } from 'bcryptjs';

export const ZInviteTokenPayload = z.object({
  sub: z.string().min(1, 'Invalid token payload'),
  email: z.email('Invalid email in token payload'),
  exp: z.number().optional(),
});
export type InviteTokenPayload = z.infer<typeof ZInviteTokenPayload>;

const jwtConfig = serverConfig.jwt;
const secret = new TextEncoder().encode(jwtConfig.inviteSecret);

const generateInviteToken = (payload: InviteTokenPayload) => {
  const expTime = payload.exp || '7d';
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expTime)
    .sign(secret);
};

const verifyInviteToken = async (token: string) => {
  const { payload } = await jose.jwtVerify(token, secret);
  return ZInviteTokenPayload.parse(payload);
};

const hashToken = async (token: string) => hash(token, 12);
const compareToken = async (token: string, hashed: string) => compare(token, hashed);

export const inviteToken = {
  generate: generateInviteToken,
  verify: verifyInviteToken,
  hash: hashToken,
  compare: compareToken,
};
