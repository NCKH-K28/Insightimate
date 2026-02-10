---
trigger: always_on
---

Unit/Integration: Co-located *.service.test.ts in src/features/*/__tests__.
Tooling: Vitest for logic.
Mocking: Heavy use of vi.mock for external services (Prisma, Authz).