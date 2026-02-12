import { auth } from '@/lib/auth';
import serverConfig from '@/configs/server';
import { AuthError } from '@/lib/http/errors';
import { prisma } from '@/lib/prisma';

const signIn = async (input: { email: string; password: string }) => {
  try {
    const result = await auth.api.signInEmail({
      body: { email: input.email, password: input.password },
      asResponse: false,
    });

    if (!result?.user || !result?.token) throw new Error('Login failed');

    return { user: result.user, token: result.token };
  } catch (error) {
    throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
  }
};

const signUp = async (input: { email: string; password: string; name: string }) => {
  try {
    const result = await auth.api.signUpEmail({
      body: { email: input.email, password: input.password, name: input.name },
      asResponse: false,
    });

    if (!result?.user || !result?.token) throw new Error('Signup failed');

    return { user: result.user, token: result.token, href: `/orgs` };
  } catch (error) {
    throw new AuthError('AUTH_EMAIL_ALREADY_EXISTS', 'Email already in use or error');
  }
};

export const authService = { signIn, signUp };

// ==== Seed data for development ====
const runSeed = async () => {
  const mockEmail = 'dangnhatminh@gmail.com';
  const user = await prisma.user.findFirst({ where: { email: mockEmail } });
  if (!user) {
    console.log('Seeding users via Better Auth...');
    try {
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
      console.log(
        'Seeded users:',
        users.map((u) => u.user.email),
      );
    } catch (e) {
      console.error('Seed error:', e);
    }
  }
};

const isDev = serverConfig.appEnv === 'development';
if (isDev && typeof window === 'undefined') {
  // Only run mostly in server context if needed, imports are server-side anyway
  runSeed()
    .then(() => console.log('Seed check completed'))
    .catch((error) => console.error('Error running seed:', error));
}
