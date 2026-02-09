# Projects v3 API Testing

## Overview

Integration tests for the Projects v3 API (`/api/v3/projs`). These tests verify the full request-response cycle against a running development server.

## Prerequisites

1. **Running dev server**:
   ```bash
   pnpm run dev
   ```

2. **Test account**: Create a dedicated test user account in your development database with at least one organization.

3. **Environment variables**: Create `.env.test.local` with your test credentials:
   ```bash
   cp .env.test.local.example .env.test.local
   ```

   Then edit `.env.test.local` and set:
   - `TEST_EMAIL` - Your test account email
   - `TEST_PASSWORD` - Your test account password
   - `TEST_BASE_URL` (optional) - Defaults to `http://localhost:3000`

   **⚠️ IMPORTANT**: `.env.test.local` is already in `.gitignore`. Never commit credentials to version control.

## Running Tests

```bash
# Run all tests
pnpm test

# Run only Projects v3 integration tests
pnpm test src/features/projects_v3/__tests__/api.integration.test.ts

# Run with watch mode
pnpm test:watch

# Run in CI mode (no watch, with coverage)
pnpm test:ci
```

## What's Tested

### Projects CRUD
- ✅ `POST /api/v3/projs` - Create project (valid input)
- ✅ `POST /api/v3/projs` - Validation errors (400)
- ✅ `POST /api/v3/projs` - Duplicate key conflict (409)
- ✅ `GET /api/v3/projs?orgId=...` - List projects
- ✅ `GET /api/v3/projs?includePermissions=true` - List with permissions
- ✅ `GET /api/v3/projs/:projId` - Get project details
- ✅ `GET /api/v3/projs/:projId` - Not found (404)
- ✅ `PATCH /api/v3/projs/:projId` - Update project
- ✅ `PATCH /api/v3/projs/:projId` - Invalid update (400)
- ✅ `DELETE /api/v3/projs/:projId` - Delete project

### Actors & Roles
- ✅ `GET /api/v3/projs/:projId/actors` - List actors
- ✅ `GET /api/v3/projs/:projId/roles` - List roles

### Negative Tests
- ✅ Unauthenticated requests return 401

## Test Data Strategy

- Each test run creates a fresh project with a unique random key
- Test project is deleted in cleanup (`afterAll`)
- Tests use the actual orgId from the test user's account
- No hardcoded IDs (except for non-existent IDs in 404 tests)

## Architecture

### `ApiClient` Helper

```typescript
class ApiClient {
  async login() // Authenticates via /api/v2/auth/signin
  async getOrgId() // Fetches available org from /api/v3/orgs
  async request(path, options) // Authenticated fetch
  async get/post/patch/delete(path, body?) // Convenience methods
}
```

The helper automatically:
1. Logs in using `TEST_EMAIL` and `TEST_PASSWORD`
2. Extracts `access_token` from Set-Cookie response
3. Injects `access_token` cookie in all subsequent requests

## Troubleshooting

### "Missing test credentials" error
Make sure `.env.test.local` exists and contains `TEST_EMAIL` and `TEST_PASSWORD`.

### "Login failed" errors
- Verify test credentials are correct
- Check that the test account exists in your dev database
- Ensure `pnpm run dev` is running on the expected port

### "No organizations found" error
The test account must belong to at least one organization. Create one via the UI or database seed.

### Connection refused
Ensure the dev server is running: `pnpm run dev`

## Adding More Tests

To add tests for actors/roles CRUD:
1. Create test role first
2. Use role ID to assign actors
3. Clean up test data in `afterAll`

Example:
```typescript
describe('Project Actors CRUD', () => {
  let roleId: string;
  
  beforeAll(async () => {
    const role = await client.post(`/api/v3/projs/${testProjectId}/roles`, {
      name: 'Test Role',
      permissions: ['view_issues'],
    });
    roleId = (await role.json()).id;
  });
  
  it('should add actor to project', async () => {
    // ... test implementation
  });
});
```

## CI/CD Integration

For CI environments:
1. Set `TEST_EMAIL` and `TEST_PASSWORD` as secrets
2. Ensure test database is seeded with test account
3. Run: `pnpm test:ci`
