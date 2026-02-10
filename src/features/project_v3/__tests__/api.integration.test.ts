import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createId } from '@paralleldrive/cuid2';

/**
 * Integration tests for Projects v3 API
 *
 * These tests hit the running development server and test the actual API endpoints.
 *
 * Prerequisites:
 * 1. Running dev server: `pnpm run dev`
 * 2. Environment variables set in .env.test.local:
 *    - TEST_BASE_URL (default: http://localhost:3000)
 *    - TEST_EMAIL (test account email)
 *    - TEST_PASSWORD (test account password)
 *    - ACCESS_TOKEN (test access token)
 *
 * Run: `pnpm test src/features/projects_v3/__tests__/api.integration.test.ts`
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    'Missing test credentials. Please set TEST_EMAIL and TEST_PASSWORD in .env.test.local',
  );
}

// Helper to perform authenticated requests
class ApiClient {
  private accessToken: string | null = null;
  private orgId: string | null = null;

  async login() {
    const response = await fetch(`${BASE_URL}/api/v2/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${await response.text()}`);
    }

    // Extract access_token from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/access_token=([^;]+)/);
      if (match) {
        this.accessToken = match[1];
      }
    }

    if (!this.accessToken) {
      throw new Error('No access_token in response');
    }

    return response.json();
  }

  async getOrgId(): Promise<string> {
    if (this.orgId) return this.orgId;

    const response = await this.request('/api/v3/orgs', { method: 'GET' });
    const { data } = await response.json();

    if (data && data.length > 0) {
      this.orgId = data[0].id;
      return this.orgId!;
    }

    throw new Error('No organizations found for test user');
  }

  async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Cookie'] = `access_token=${this.accessToken}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    return response;
  }

  async get(path: string) {
    return this.request(path, { method: 'GET' });
  }

  async post(path: string, body: unknown) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch(path: string, body: unknown) {
    return this.request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete(path: string) {
    return this.request(path, { method: 'DELETE' });
  }
}

describe('Projects v3 API Integration Tests', () => {
  let client: ApiClient;
  let testOrgId: string;
  let testProjectId: string;
  let testProjectKey: string;

  beforeAll(async () => {
    client = new ApiClient();
    await client.login();
    testOrgId = await client.getOrgId();
    console.log(`✓ Logged in, using org: ${testOrgId}`);
  });

  describe('POST /api/v3/projs - Create Project', () => {
    it('should create a new project with valid input', async () => {
      testProjectKey = `TST${createId().slice(0, 5).toUpperCase()}`; // Max 10 chars: TST + 5 chars = 8
      const user = await (await client.get('/api/v2/auth/me')).json();

      const projectData = {
        key: testProjectKey,
        type: 'SOFTWARE',
        name: 'Test Project for API',
        description: 'Created by integration tests',
        leadId: user.id,
        orgId: testOrgId,
        roles: [],
      };

      const response = await client.post('/api/v3/projs', projectData);
      expect(response.status).toBe(200);

      const project = await response.json();
      expect(project.id).toBeDefined();
      expect(project.key).toBe(testProjectKey);
      expect(project.name).toBe('Test Project for API');
      expect(project.orgId).toBe(testOrgId);

      testProjectId = project.id;
    });

    it('should return 400 for invalid input (missing required fields)', async () => {
      const response = await client.post('/api/v3/projs', {
        name: 'Incomplete Project',
        // Missing key, type, leadId, orgId
      });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate project key', async () => {
      const user = await (await client.get('/api/v2/auth/me')).json();

      const response = await client.post('/api/v3/projs', {
        key: testProjectKey, // Same key as created above
        type: 'SOFTWARE',
        name: 'Duplicate Key Project',
        leadId: user.id,
        orgId: testOrgId,
      });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /api/v3/projs - List Projects', () => {
    it('should list projects filtered by orgId', async () => {
      const response = await client.get(`/api/v3/projs?orgId=${testOrgId}`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBeGreaterThan(0);

      // Find our test project
      const testProject = result.data.find((p: any) => p.id === testProjectId);
      expect(testProject).toBeDefined();
    });

    it('should include permissions when requested', async () => {
      const response = await client.get(`/api/v3/projs?orgId=${testOrgId}&includePermissions=true`);
      expect(response.status).toBe(200);

      const result = await response.json();
      const project = result.data.find((p: any) => p.id === testProjectId);

      if (project) {
        expect(project.permissions).toBeDefined();
      }
    });
  });

  describe('GET /api/v3/projs/:projId - Get Project Details', () => {
    it('should return project details with lead and fields', async () => {
      const response = await client.get(`/api/v3/projs/${testProjectId}`);
      expect(response.status).toBe(200);

      const project = await response.json();
      expect(project.id).toBe(testProjectId);
      expect(project.key).toBe(testProjectKey);
      expect(project.lead).toBeDefined();
      expect(project.types).toBeInstanceOf(Array);
      expect(project.priorities).toBeInstanceOf(Array);
      expect(project.statuses).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await client.get('/api/v3/projs/proj_nonexistent');
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v3/projs/:projId - Update Project', () => {
    it('should update project metadata', async () => {
      const updateData = {
        name: 'Updated Test Project',
        description: 'Updated description',
      };

      const response = await client.patch(`/api/v3/projs/${testProjectId}`, updateData);
      expect(response.status).toBe(200);

      const updated = await response.json();
      expect(updated.name).toBe('Updated Test Project');
      expect(updated.description).toBe('Updated description');
    });

    it('should return 400 for invalid update data', async () => {
      const response = await client.patch(`/api/v3/projs/${testProjectId}`, {
        name: '', // Invalid: empty name violates min(1) rule
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Project Actors API', () => {
    let testActorId: string;

    it('GET /api/v3/projs/:projId/actors - should list project actors', async () => {
      const response = await client.get(`/api/v3/projs/${testProjectId}/actors`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.data).toBeInstanceOf(Array);
    });

    // Note: Adding/removing actors requires additional setup (roles, other users)
    // Skipping for now unless we have proper test data
  });

  describe('Project Roles API', () => {
    it('GET /api/v3/projs/:projId/roles - should list project roles', async () => {
      const response = await client.get(`/api/v3/projs/${testProjectId}/roles`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.data).toBeInstanceOf(Array);
      // Note: Projects don't have default roles unless explicitly created
      expect(typeof result.meta.total).toBe('number');
    });
  });

  describe('DELETE /api/v3/projs/:projId - Delete Project', () => {
    it('should delete the test project', async () => {
      const response = await client.delete(`/api/v3/projs/${testProjectId}`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.id).toBe(testProjectId);
    });

    it('should return 404 after deletion', async () => {
      const response = await client.get(`/api/v3/projs/${testProjectId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('Negative Tests - Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const unauthClient = new ApiClient();
      const response = await unauthClient.get('/api/v3/projs');

      expect(response.status).toBe(401);
    });
  });

  afterAll(() => {
    console.log('✓ Test suite completed');
  });
});
