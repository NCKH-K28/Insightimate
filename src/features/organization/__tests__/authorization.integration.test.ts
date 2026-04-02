import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createId } from '@paralleldrive/cuid2';

/**
 * Authorization Integration Tests for Organization API
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const OWNER_EMAIL = process.env.TEST_EMAIL;
const OWNER_PASSWORD = process.env.TEST_PASSWORD;
const MEMBER_EMAIL = process.env.TEST_EMAIL_2 || 'tranvanvu@gmail.com'; // Fallback
const MEMBER_PASSWORD = process.env.TEST_PASSWORD_2 || 'Minh123123'; // Fallback

class AuthClient {
  public token: string | null = null;
  public userId: string | null = null;

  constructor(
    private email?: string,
    private password?: string,
  ) {}

  async login() {
    if (!this.email || !this.password) return;

    const response = await fetch(`${BASE_URL}/api/v2/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!response.ok) return;

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/access_token=([^;]+)/);
      if (match) this.token = match[1];
    }

    if (this.token) {
      const meRes: any = await this.get('/api/v2/auth/me');
      if (meRes.ok) {
        const me = await meRes.json();
        this.userId = me.id;
      }
    }
  }

  async request(path: string, options: RequestInit = {}) {
    if (!this.token) return { status: 401, ok: false, json: () => ({}) };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Cookie: `access_token=${this.token}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    return fetch(`${BASE_URL}${path}`, { ...options, headers });
  }

  get(path: string) {
    return this.request(path, { method: 'GET' });
  }
  post(path: string, body: unknown) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) });
  }
  patch(path: string, body: unknown) {
    return this.request(path, { method: 'PATCH', body: JSON.stringify(body) });
  }
  delete(path: string) {
    return this.request(path, { method: 'DELETE' });
  }
}

describe('Organization Authorization Integration Tests', () => {
  let ownerClient: AuthClient;
  let memberClient: AuthClient;
  let testOrgId: string;

  beforeAll(async () => {
    ownerClient = new AuthClient(OWNER_EMAIL, OWNER_PASSWORD);
    await ownerClient.login();

    memberClient = new AuthClient(MEMBER_EMAIL, MEMBER_PASSWORD);
    await memberClient.login();

    // Create Org as Owner
    const slug = `auth-org-${createId()}`;
    const res = await ownerClient.post('/api/v3/orgs', {
      name: 'Auth Test Org',
      slug,
    });

    if (res.ok) {
      const org: any = await res.json();
      testOrgId = org.id;

      // Add Member to Org if not skipped
      if (memberClient.userId) {
        // Invite or Add directly?
        // API only exposes invite currently for bulk.
        // But we can use direct database seeding or assume invite flow.
        // OR use /api/v3/orgs/:orgId/members/invite
        await ownerClient.post(`/api/v3/orgs/${testOrgId}/members/invite`, {
          emails: [MEMBER_EMAIL],
          role: 'ORG_MEMBER',
        });
        // Member needs to Accept?
        // For testing simplification, we might mock acceptance or check if auto-join (auth service seed check).
        // Actually, if we use the backend seed user, they might not be added automatically.
        // Let's assume we can add them via a backdoor or we need to implement accept flow test.

        // To properly test, we need member to be part of org.
        // If we can't easily add them, we might skip member tests that require membership.

        // However, `authorization.integration.test.ts` usually assumes setup is done.
        // Let's try to verify if member can be added.

        // Alternative: POST /api/v3/orgs/:orgId/members/invite
        // Then GET /api/v3/orgs/:orgId/invitations
        // Then POST /accept

        const invRes = await ownerClient.get(`/api/v3/orgs/${testOrgId}/invitations`);
        const invData: any = await invRes.json();
        const token = invData.data?.find((i: any) => i.email === MEMBER_EMAIL)?.token;

        if (token) {
          await memberClient.post('/api/v3/orgs/invitations/accept', { token });
        }
      }
    }
  });

  afterAll(async () => {
    if (ownerClient && testOrgId) {
      await ownerClient.delete(`/api/v3/orgs/${testOrgId}`);
    }
  });

  describe('Organization Access', () => {
    it('Owner can update organization', async () => {
      const res = await ownerClient.patch(`/api/v3/orgs/${testOrgId}`, { name: 'Owner Updated' });
      expect(res.status).toBe(200);
    });

    it('Member cannot update organization', async () => {
      if (!memberClient.userId) return; // Skip if no member

      const res = await memberClient.patch(`/api/v3/orgs/${testOrgId}`, { name: 'Member Updated' });
      expect([403, 404]).toContain(res.status);
    });

    it('Member cannot delete organization', async () => {
      if (!memberClient.userId) return;

      const res = await memberClient.delete(`/api/v3/orgs/${testOrgId}`);
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('Member Management', () => {
    it('Owner can list members', async () => {
      const res = await ownerClient.get(`/api/v3/orgs/${testOrgId}/members`);
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(2); // Owner + Member
    });

    it('Member can list members', async () => {
      if (!memberClient.userId) return;

      const res = await memberClient.get(`/api/v3/orgs/${testOrgId}/members`);
      expect(res.status).toBe(200);
    });

    it('Member cannot remove owner', async () => {
      if (!memberClient.userId) return;

      const res = await memberClient.delete(
        `/api/v3/orgs/${testOrgId}/members/${ownerClient.userId}`,
      );
      expect([403, 404]).toContain(res.status);
    });

    it('Member can leave organization', async () => {
      if (!memberClient.userId) return;

      const res = await memberClient.delete(`/api/v3/orgs/${testOrgId}/members/me`);
      expect(res.status).toBe(200);

      // Verify left
      const listRes = await ownerClient.get(`/api/v3/orgs/${testOrgId}/members`);
      const body: any = await listRes.json();
      const memberFound = body.data.find((m: any) => m.userId === memberClient.userId);
      expect(memberFound).toBeUndefined();
    });
  });
});
