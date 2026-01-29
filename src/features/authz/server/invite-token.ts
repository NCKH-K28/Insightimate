import z from 'zod';
import * as jose from 'jose';
import serverConfig from '@/configs/server';

export const ZInviteTokenPayload = z.object({
  sub: z.string().min(1, 'Invalid token payload'),
  email: z.email('Invalid email in token payload'),
});
export type InviteTokenPayload = z.infer<typeof ZInviteTokenPayload>;

const jwtConfig = serverConfig.jwt;
const secret = new TextEncoder().encode(jwtConfig.inviteSecret);

const generateInviteToken = (payload: InviteTokenPayload) => {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token valid for 7 days
    .sign(secret);
};

const verifyInviteToken = async (token: string) => {
  const { payload } = await jose.jwtVerify(token, secret);
  return ZInviteTokenPayload.parse(payload);
};

// kiểm tra xem token còn hạn không?

export const inviteToken = { generate: generateInviteToken, verify: verifyInviteToken };
