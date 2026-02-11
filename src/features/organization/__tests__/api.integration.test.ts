// import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// import { createId } from '@paralleldrive/cuid2';

// /**
//  * Integration tests for Organization API
//  */

// const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
// const TEST_EMAIL = process.env.TEST_EMAIL;
// const TEST_PASSWORD = process.env.TEST_PASSWORD;

// if (!TEST_EMAIL || !TEST_PASSWORD) {
//   // Warn but don't fail immediately in case running unit tests only
//   console.warn('Missing test credentials. Integration tests may fail.');
// }

// class ApiClient {
//   private accessToken: string | null = null;
//   public userId: string | null = null;

//   async login() {
//     if (!TEST_EMAIL || !TEST_PASSWORD) return;

//     const response = await fetch(`${BASE_URL}/api/v2/auth/signin`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
//     });

//     if (!response.ok) {
//       throw new Error(`Login failed: ${response.status} ${await response.text()}`);
//     }

//     const setCookie = response.headers.get('set-cookie');
//     if (setCookie) {
//       const match = setCookie.match(/access_token=([^;]+)/);
//       if (match) this.accessToken = match[1];
//     }

//     if (!this.accessToken) throw new Error('No access_token in response');

//     // Get user ID
//     const meRes = await this.get('/api/v2/auth/me');
//     const me = await meRes.json();
//     this.userId = me.id;

//     return response.json();
//   }

//   async request(path: string, options: RequestInit = {}) {
//     const headers: Record<string, string> = {
//       'Content-Type': 'application/json',
//       ...((options.headers as Record<string, string>) || {}),
//     };

//     if (this.accessToken) {
//       headers['Cookie'] = `access_token=${this.accessToken}`;
//     }

//     return fetch(`${BASE_URL}${path}`, { ...options, headers });
//   }

//   async get(path: string) {
//     return this.request(path, { method: 'GET' });
//   }

//   async post(path: string, body: unknown) {
//     return this.request(path, { method: 'POST', body: JSON.stringify(body) });
//   }

//   async patch(path: string, body: unknown) {
//     return this.request(path, { method: 'PATCH', body: JSON.stringify(body) });
//   }

//   async delete(path: string) {
//     return this.request(path, { method: 'DELETE' });
//   }
// }

// describe('Organization API Integration Tests', () => {
//   let client: ApiClient;
//   let testOrgId: string;
//   let testSlug: string;

//   beforeAll(async () => {
//     client = new ApiClient();
//     await client.login();
//   });

//   describe('POST /api/v3/orgs - Create Organization', () => {
//     it('should create a new organization with valid input', async () => {
//       testSlug = `test-org-${createId()}`;
//       const orgData = {
//         name: 'Test Organization',
//         slug: testSlug,
//       };

//       const response = await client.post('/api/v3/orgs', orgData);
//       expect(response.status).toBe(200);

//       const org = await response.json();
//       expect(org.id).toBeDefined();
//       expect(org.slug).toBe(testSlug);
//       expect(org.name).toBe('Test Organization');
//       expect(org._me.role).toBe('ORG_OWNER');

//       testOrgId = org.id;
//     });

//     it('should return 409 for duplicate slug', async () => {
//       const response = await client.post('/api/v3/orgs', {
//         name: 'Duplicate Org',
//         slug: testSlug,
//       });

//       expect(response.status).toBe(409); // ORG_CONFLICT mapped to 409 usually
//     });
//   });

//   describe('GET /api/v3/orgs - List Organizations', () => {
//     it('should list organizations', async () => {
//       const response = await client.get('/api/v3/orgs');
//       expect(response.status).toBe(200);

//       const result = await response.json();
//       expect(result.data).toBeInstanceOf(Array);

//       const createdOrg = result.data.find((o: any) => o.id === testOrgId);
//       expect(createdOrg).toBeDefined();
//     });
//   });

//   describe('GET /api/v3/orgs/:orgId - Get Organization', () => {
//     it('should return organization details by ID', async () => {
//       const response = await client.get(`/api/v3/orgs/${testOrgId}`);
//       expect(response.status).toBe(200);

//       const org = await response.json();
//       expect(org.id).toBe(testOrgId);
//     });

//     it('should return organization details by slug', async () => {
//       const response = await client.get(`/api/v3/orgs/${testSlug}?by=slug`);
//       expect(response.status).toBe(200);

//       const org = await response.json();
//       expect(org.id).toBe(testOrgId);
//     });

//     it('should return 404 for non-existent org', async () => {
//       const response = await client.get('/api/v3/orgs/non-existent-id');
//       expect(response.status).toBe(404);
//     });
//   });

//   describe('PATCH /api/v3/orgs/:orgId - Update Organization', () => {
//     it('should update organization name', async () => {
//       const response = await client.patch(`/api/v3/orgs/${testOrgId}`, {
//         name: 'Updated Org Name',
//       });
//       expect(response.status).toBe(200);

//       const org = await response.json();
//       expect(org.name).toBe('Updated Org Name');
//     });
//   });

//   describe('POST /api/v3/orgs/slug-available - Check Slug', () => {
//     it('should return false for existing slug', async () => {
//       const res = await client.post('/api/v3/orgs/slug-available', { slug: testSlug });
//       const body = await res.json();
//       expect(body.available).toBe(false);
//     });

//     it('should return true for new slug', async () => {
//       const res = await client.post('/api/v3/orgs/slug-available', { slug: `new-${createId()}` });
//       const body = await res.json();
//       expect(body.available).toBe(true);
//     });
//   });

//   describe('GET /api/v3/orgs/:orgId/members', () => {
//     it('should list members', async () => {
//       const res = await client.get(`/api/v3/orgs/${testOrgId}/members`);
//       expect(res.status).toBe(200);
//       const body = await res.json();
//       expect(body.data).toBeInstanceOf(Array);
//       expect(body.data).toHaveLength(1); // Owner
//       expect(body.data[0].userId).toBe(client.userId);
//     });
//   });

//   describe('DELETE /api/v3/orgs/:orgId', () => {
//     it('should delete organization', async () => {
//       const response = await client.delete(`/api/v3/orgs/${testOrgId}`);
//       expect(response.status).toBe(200);
//     });

//     it('should return 404 after deletion', async () => {
//       const response = await client.get(`/api/v3/orgs/${testOrgId}`);
//       expect(response.status).toBe(404);
//     });
//   });
// });
