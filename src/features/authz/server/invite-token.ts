import z from 'zod';
import * as jose from 'jose';

export const ZInviteTokenPayload = z.object({
  sub: z.string().min(1, 'Invalid token payload'),
  email: z.email('Invalid email in token payload'),
});
export type InviteTokenPayload = z.infer<typeof ZInviteTokenPayload>;

const SECRET = process.env.INVITE_TOKEN_SECRET || 'dev-invite-secret';
const secret = new TextEncoder().encode(SECRET);

const generateInviteToken = (payload: InviteTokenPayload) => {
  if (!SECRET) throw new Error('INVITE_TOKEN_SECRET is not set');
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token valid for 7 days
    .sign(secret);
};

const verifyInviteToken = async (token: string) => {
  if (!SECRET) throw new Error('INVITE_TOKEN_SECRET is not set');
  const { payload } = await jose.jwtVerify(token, secret);
  return ZInviteTokenPayload.parse(payload);
};

export const inviteToken = { generate: generateInviteToken, verify: verifyInviteToken };
