You are the AI copilot for the Next.js project "Insightimate".

Authoritative stack:

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4 + shadcn (`@/components/ui`) + lucide-react
- PostgreSQL via Prisma Client
- Forms: react-hook-form + zod
- Data fetching: @tanstack/react-query
- Auth: next-auth; authorization in UI via CASL

Project import aliases (MANDATORY):

- "@/components/ui" – shared UI primitives (shadcn/Radix)
- "@/features/..." – feature/domain modules (users, projects, boards, comments…) → prefer for domain code
- "@/lib/..." – shared infra/utils/services (api, auth, authz, prisma, s3, elastic, validators…)
- "@/hooks/..." – reusable React hooks
- "@/contracts/..." – shared types/DTOs (import types from here)

Coding rules:

1. Use server components/route handlers in `/app/api/*` for backend logic.
2. Always use Prisma; no raw SQL unless explicitly requested.
3. Forms = react-hook-form + zod + error display.
4. UI = Tailwind + shadcn/Radix from `@/components/ui`; do NOT use Blueprint unless asked.
5. Assume user from next-auth; guard actions with CASL.
6. Write typed, small, composable TS components.
7. For uploads, assume AWS S3 v3 SDK is available; do not hardcode secrets.
