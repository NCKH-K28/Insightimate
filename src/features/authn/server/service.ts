import { prisma } from '@/lib/prisma';

import { verifyPassword, hashPassword } from '../lib/password';
import { generateToken } from '@/lib/auth/authn/session';
import serverConfig from '@/configs/server';
import { AuthError } from '@/lib/http/errors';
import { genUserId } from '../lib/id';

const signIn = async (input: { email: string; password: string }) => {
  const acc = await prisma.account.findUnique({ where: { email: input.email } });
  if (!acc) throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
  const isValid = await verifyPassword(input.password, acc.credential);
  if (!isValid) throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');

  const user = await prisma.user.findUniqueOrThrow({ where: { email: acc.email } });

  const token = await generateToken({ sub: user.id, email: user.email });
  return { user, token };
};

const signUp = async (input: { email: string; password: string; name: string }) => {
  const existingAcc = await prisma.account.findUnique({ where: { email: input.email } });
  if (existingAcc) throw new AuthError('AUTH_EMAIL_ALREADY_EXISTS', 'Email already in use');

  const credential = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      id: genUserId(),
      name: input.name,
      email: input.email,
      account: { create: { credential } },
    },
  });

  const token = await generateToken({ sub: user.id, email: user.email });
  return { user, token, href: `/orgs` };
};

export const authService = { signIn, signUp };

// ==== Seed data for development ====
// TODO: Move to a proper seed script
const runSeed = async () => {
  const mockEmail = 'dangnhatminh@gmail.com';
  const user = await prisma.user.findFirst({ where: { email: mockEmail } });
  if (!user) {
    const users = await Promise.all([
      signUp({
        email: 'dangnhatminh@gmail.com',
        name: 'Dang Nhat Minh',
        password: 'Minh123123',
      }),
      signUp({
        email: 'tranvanvu@gmail.com',
        name: 'Tran Van Vu',
        password: 'Minh123123',
      }),
      signUp({
        email: 'nguyenhuuhung@gmail.com',
        name: 'Nguyen Huu Hung',
        password: 'Minh123123',
      }),
      signUp({
        email: 'nguyennhathuy@gmail.com',
        name: 'Nguyen Nhat Huy',
        password: 'Minh123123',
      }),
    ]);

    console.log('Seeded users:', users);
  }
};

const isDev = serverConfig.appEnv === 'development';
if (isDev)
  await runSeed()
    .then(() => console.log('Seed completed'))
    .catch((error) => console.error('Error running seed:', error));
