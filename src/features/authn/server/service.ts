import { prisma } from '@/lib/prisma';
import { EmailAlreadyExistsError, InvalidCredentialsError } from '@/lib/http/errors';
import { createId as generateCuid2 } from '@paralleldrive/cuid2';

import { verifyPassword, hashPassword } from './password';
import { generateToken } from '@/lib/auth/session';

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

  const token = await generateToken({ sub: user.id, email: user.email });
  return { user, token };
};

export const authService = { signIn, signUp };

const runSeed = async () => {
  if (process.env.NODE_ENV !== 'development') return;
  if (typeof window !== 'undefined') return;
  const mockEmail = 'dangnhatminh@gmail.com';
  let user = await prisma.user.findFirst({ where: { email: mockEmail } });
  if (!user) {
    const users = await Promise.all([
      signUp({
        email: 'dangnhatminh@gmail.com',
        name: 'Dang Nhat Minh',
        password: 'Minh123123',
      }),
      signUp({
        email: 'danglamoanh@gmail.com',
        name: 'Dang Lam Oanh',
        password: 'Minh123123',
      }),
      signUp({
        email: 'dangphuonganh@gmail.com',
        name: 'Dang Phuong Anh',
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
    ]);

    console.log('Seeded users:', users);
  }
};

await runSeed()
  .then(() => console.log('Seed completed'))
  .catch((error) => console.error('Error running seed:', error));
