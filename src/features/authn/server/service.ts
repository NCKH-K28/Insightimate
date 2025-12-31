import { prisma } from '@/lib/prisma';
import { EmailAlreadyExistsError, InvalidCredentialsError } from '@/lib/http/errors';
import { createId as generateCuid2 } from '@paralleldrive/cuid2';

import { verifyPassword, hashPassword } from './password';
import { generateToken } from '@/lib/auth/authn/session';
import serverConfig from '@/configs/server';
import { buildWorkspaceTuples } from '@/features/authz/api/tuple-factory';
import { openfgaClient } from '@/lib/auth/authz/openfga';

const signIn = async (input: { email: string; password: string }) => {
  const acc = await prisma.account.findUnique({ where: { email: input.email } });
  if (!acc) throw new InvalidCredentialsError();
  const isValid = await verifyPassword(input.password, acc.credential);
  if (!isValid) throw new InvalidCredentialsError();

  const user = await prisma.user.findUniqueOrThrow({ where: { email: acc.email } });

  const token = await generateToken({ sub: user.id, email: user.email });
  return { user, token };
};

const signUp = async (input: { email: string; password: string; name: string }) => {
  const existingAcc = await prisma.account.findUnique({ where: { email: input.email } });
  if (existingAcc) throw new EmailAlreadyExistsError('Email already in use');

  const credential = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      id: `user_${generateCuid2()}`,
      name: input.name,
      email: input.email,
      account: { create: { credential } },
    },
  });

  const ws = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { id: `ws_${generateCuid2()}`, name: 'Default Workspace', ownerId: user.id },
      select: { id: true, ownerId: true, members: true },
    });
    const tups = buildWorkspaceTuples(ws);
    await openfgaClient.write({ writes: tups });
    return ws;
  });

  const token = await generateToken({ sub: user.id, email: user.email });
  return { user, token, href: `/wps/${ws.id}` };
};

export const authService = { signIn, signUp };

// ==== Seed data for development ====
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
