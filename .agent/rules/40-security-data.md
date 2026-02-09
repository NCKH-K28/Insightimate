---
trigger: always_on
---

Auth: getAuthFromRequest + middlewareHandler guards.
Authorization: Explicit checks (ensureCan, Cerbos/OpenFGA) in services.
Data: Repository pattern via Prisma services in src/features/*/server.