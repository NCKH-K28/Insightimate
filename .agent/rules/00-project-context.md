---
trigger: always_on
---

Context: Next.js 15 (App Router), React 19, Tailwind 4.
Stack: Prisma, Postgres, Cerbos/OpenFGA, Vercel AI SDK.
Structure: Feature-first architecture (src/features), Shared contracts (src/contracts).

## Ref Project (Reference ONLY)
- Located at: ./plane/
- This is Plane (makeplane/plane) — chỉ dùng để tham khảo logic, pattern, architecture
- NEVER modify any file in ./plane/
- NEVER import anything from ./plane/ into Main Project
- NEVER run any commands (npm install, build, dev...) inside ./plane/

## Terminology mapping
- Plane "Issue"      → Issue
- Plane "Workspace"  → Organization
- Plane "Cycle"      → Sprint