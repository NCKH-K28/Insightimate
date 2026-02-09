---
trigger: always_on
---

Unit/Integration: Co-located *.service.test.ts in server folders.
Tooling: Vitest for logic.
Mocking: Heavy use of vi.mock for external services (Prisma, Authz).