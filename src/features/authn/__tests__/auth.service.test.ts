import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock server-only to avoid errors in test environment
vi.mock('server-only', () => {
  return {};
});

import { authService } from '../server/service';
import { auth } from '@/lib/auth';

// Mock Prisma
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// We also need to mock Better Auth's internal API calls to avoid it trying to make real network requests or use real crypto if not needed
// However, we want to test that authService calls auth.api methods.
// Since `auth` is imported in `service.ts`, we can mock `@/lib/auth`.
// If we mock `@/lib/auth`, we are testing `authService` -> `auth.api` (mock).
// This is unit testing `authService`. It confirms we use Better Auth.
// To test "Creates a user", we'd trust Better Auth does its job, OR we avoid mocking `@/lib/auth` and rely on `@/lib/prisma` mock.
// Let's try to mock `@/lib/auth` to return success responses, because running real Better Auth logic in unit test might be complex (crypto, timeouts, etc).

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signInEmail: vi.fn(),
      signUpEmail: vi.fn(),
    },
  },
}));

describe('authService', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    token: 'session-token-123',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 3600 * 1000),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully and return user and token', async () => {
      // Mock success response from Better Auth
      vi.mocked(auth.api.signInEmail).mockResolvedValue({
        user: mockUser,
        token: mockSession.token,
        redirect: false,
      } as any);

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        asResponse: false,
      });

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockSession.token);
    });

    it('should throw AUTH_INVALID_CREDENTIALS on failure', async () => {
      // Mock failure from Better Auth
      vi.mocked(auth.api.signInEmail).mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.signIn({
          email: 'wrong@example.com',
          password: 'pass',
        }),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      vi.mocked(auth.api.signUpEmail).mockResolvedValue({
        user: mockUser,
        token: mockSession.token,
        redirect: false,
      } as any);

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(auth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
        asResponse: false,
      });

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockSession.token);
      expect(result.href).toBe('/orgs');
    });

    it('should throw AUTH_EMAIL_ALREADY_EXISTS on failure', async () => {
      vi.mocked(auth.api.signUpEmail).mockRejectedValue(new Error('API Error'));

      await expect(
        authService.signUp({
          email: 'existing@example.com',
          password: 'pass',
          name: 'User',
        }),
      ).rejects.toThrow('Email already in use or error');
    });
  });
});
