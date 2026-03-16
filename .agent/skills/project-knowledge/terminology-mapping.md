# Terminology Mapping — Insightimate ↔ Plane

> **Last scanned**: 2026-03-16

---

## Domain Concept Mapping

| Main Project Term | Plane Equivalent | Notes / Differences |
|------------------|-----------------|---------------------|
| **Organization** | **Workspace** | Same concept. Main uses `Organization` model + `/api/v3/orgs/`. Plane uses `Workspace` model + `/api/workspaces/`. URL: Main = `/o/[orgSlug]`, Plane = `/[workspaceSlug]` |
| **OrgMember** | **WorkspaceMember** | Roles differ: Main = `ORG_OWNER/ORG_ADMIN/ORG_MEMBER`. Plane = role integers (5/10/15/20) |
| **OrgInvitation** | **WorkspaceMemberInvite** | Main has token-based flow, Plane uses similar invite model |
| **Project** | **Project** | Nearly identical concept. Main adds `archived` boolean and `ProjectType` enum. Plane has richer project config (network, emoji, cover_image, etc.) |
| **ProjectActor** | **ProjectMember** | Main uses actor/role pattern (supports USER and TEAM actor types). Plane uses direct ProjectMember with role integer |
| **ProjectRole** | *(built-in roles)* | Main has custom roles with permissions array. Plane uses fixed role levels (Admin=20, Member=15, Viewer=10, Guest=5) |
| **Issue** | **Issue / Work Item** | Same core concept. Plane recently renamed to "Work Item" internally. Main uses `Issue` with project-scoped keys. Both support sub-issues, assignees, labels, etc. |
| **IssueType** | **Work Item Type** | Main has project-scoped types, Plane has workspace-level work item types with hierarchy (Epic/Task/Sub-task) |
| **IssueStatus** | **State** | Main = `IssueStatus` with `IssueStatusCategory` (TODO/IN_PROGRESS/DONE). Plane = `State` with groups (backlog/unstarted/started/completed/cancelled) |
| **IssuePriority** | **Priority** | Main has project-scoped priority model. Plane uses `priority` field with built-in values (urgent/high/medium/low/none) |
| **IssueResolution** | *(no equivalent)* | Main has resolution model (Done/Won't Fix/Duplicate/etc.). Plane handles this via state transitions |
| **IssueLink** | **IssueLink** | Both support linking issues. Main types: BLOCKS/RELATES_TO/DUPLICATES. Plane similar concept |
| **Sprint** | **Cycle** | Same concept, different name. Main = Sprint with FUTURE/ACTIVE/CLOSED states. Plane = Cycle with similar lifecycle. Main sprints are board-scoped, Plane cycles are project-scoped |
| **Board** | *(no direct equivalent)* | Main has explicit Board entity (SCRUM/KANBAN) per project. Plane handles board views as display preferences, not a separate entity |
| **BoardColumn** | *(display config)* | Main has explicit column-to-status mapping. Plane renders columns from states directly |
| **BoardIssue** | *(no equivalent)* | Main has explicit board membership with rank (Decimal). Plane uses issue's `sort_order` field |
| **Team** | *(no equivalent in Plane)* | Main has cross-project teams with members. Plane has no team concept — only workspace/project members |
| **AIAgent** | *(no equivalent)* | Main has full AI agent system with data sources, analyses, traces, memories. Plane has no AI agent feature |
| **DataSource** | *(no equivalent)* | Main-only: PROJECT/FILE data sources for AI agents |
| **Analysis** | *(no equivalent)* | Main-only: SUMMARY/INSIGHT_EXTRACTION/ANOMALY_DETECTION/ESTIMATION |
| **Comment / CommentThread** | **IssueComment** | Main uses thread-based comments (CommentThread → Comment). Plane uses flat comment model with `IssueComment` |
| **ActivityEvent** | **IssueActivity** | Main has org-level ActivityEvent with action/entity enums. Plane has IssueActivity model for issue-level tracking |
| **Plan / Scenario** | *(no equivalent)* | Main-only: planning with scenarios and scenario issues |
| **ProjectFavorite** | **UserFavorite** | Main has project favorites. Plane has generic favorites across entity types |
| **SprintUserPreference** | *(no equivalent)* | Main-only: per-user sprint display preferences |
| *(no equivalent)* | **Module** | Plane has Modules for grouping issues by feature/initiative. Main has no module concept |
| *(no equivalent)* | **Page** | Plane has Pages (wiki/docs). Main has no page concept |
| *(no equivalent)* | **View** | Plane has saved Views (custom filtered issue lists). Main has no saved view concept |
| *(no equivalent)* | **Intake** | Plane has Intake (formerly Inbox) for triaging incoming issues. Main has no intake |
| *(no equivalent)* | **Label** | Plane has Labels for issue categorization. Main has no label model |
| *(no equivalent)* | **Estimate** | Plane has Estimate system (point scales). Main has `storyPoints` field but no estimate configuration |
| *(no equivalent)* | **Notification** | Plane has notification system. Main has none |
| *(no equivalent)* | **Webhook** | Plane has webhook integrations. Main has none |
| *(no equivalent)* | **Sticky** | Plane has sticky notes (personal quick notes). Main has none |
| **AuthzOutbox** | *(no equivalent)* | Main-only: transactional outbox for authz sync (OpenFGA) |
| **DebeziumSignal** | *(no equivalent)* | Main-only: CDC signal table for Debezium |

---

## URL Convention Differences

| Aspect | Main Project | Plane |
|--------|-------------|-------|
| Base URL pattern | `/o/[orgSlug]/...` | `/[workspaceSlug]/...` |
| API versioning | `/api/v2/...` (legacy), `/api/v3/...` (current) | `/api/v1/...` (legacy), `/api/...` (current) |
| Project URL | `/o/[orgSlug]/projs/[projId]` | `/[workspaceSlug]/projects/[projectId]` |
| Sprint/Cycle URL | `/o/[orgSlug]/sprints/[sprintId]` | `/[workspaceSlug]/projects/[projectId]/cycles/[cycleId]` |
| Team URL | `/o/[orgSlug]/teams/[teamId]` | *(no equivalent)* |
| Agent URL | `/o/[orgSlug]/agents/[agentId]` | *(no equivalent)* |
| Settings URL | `/o/(settings)/[orgSlug]/settings/...` | `/[workspaceSlug]/settings/...` |
| API: Projects | `/api/v3/projs/` | `/api/workspaces/<slug>/projects/` |
| API: Issues | `/api/v3/boards/:boardId/issues/` | `/api/workspaces/<slug>/projects/<id>/work-items/` |
| API: Sprints/Cycles | `/api/v3/sprints/` | `/api/workspaces/<slug>/projects/<id>/cycles/` |
| API: Members | `/api/v3/orgs/:orgId/members/` | `/api/workspaces/<slug>/members/` |

---

## Schema / Contract Naming Patterns

| Aspect | Main Project | Plane |
|--------|-------------|-------|
| Validation | Zod schemas (`Z` prefix) in `src/contracts/` | Django Serializers in `serializers/` |
| Input naming | `ZProjectCreateInput`, `ZSprintUpdateInput` | `ProjectSerializer`, `CycleSerializer` |
| Response format | Direct JSON from services | DRF serialized response with `results`/`count` |
| ID format | CUID (`@default(cuid())`) | UUID (`uuid4`) |
| Timestamps | `createdAt`/`updatedAt` (camelCase in app) | `created_at`/`updated_at` (snake_case) |
| Soft delete | `removedAt` (Organization), `archived` (Project/Issue) | `is_deleted` flag |
| Database mapping | `@@map("snake_case")` to PostgreSQL | Django ORM default |

---

## Key Architectural Differences

| Aspect | Main Project | Plane |
|--------|-------------|-------|
| Backend | Next.js API Routes + Hono (TypeScript) | Django REST Framework (Python) |
| Auth | better-auth (session-based) | Custom token + session auth |
| Authorization | OpenFGA + Cerbos (external) | Django Permission classes (in-process) |
| Task queue | KafkaJS + Debezium CDC | Celery (Redis/RabbitMQ) |
| Search | Elasticsearch | Built-in Django ORM queries |
| AI | Vercel AI SDK + LangChain + LangGraph | No AI features |
| Frontend | Next.js App Router + Jotai/Zustand | Next.js App Router + Mobx stores |
| Board model | Explicit Board entity (1:1 with Project) | Display-only board view |
| Sprint model | Board-scoped Sprint | Project-scoped Cycle |
