# Main Project — Feature Inventory

> **Last scanned**: 2026-03-16  
> **Root**: `/home/dang-nhat-minh/Workspaces/Insightimate`

---

## 1. Tech Stack

| Category | Technology | Version | Notes |
|----------|-----------|---------|-------|
| Runtime | Node.js | 22.x | pnpm 10.10.0 |
| Framework | Next.js (App Router) | 15.5.9 | |
| UI Library | React | 19.1.2 | |
| Language | TypeScript | 5.x | |
| Styling | Tailwind CSS | 4.x | `@tailwindcss/postcss`, `tw-animate-css` |
| Component Library | shadcn/ui + Radix UI | various | 25+ Radix primitives |
| State Management | Jotai + Zustand + TanStack Query | jotai 2.12, zustand 5.0 | jotai-family, jotai-optics, jotai-tanstack-query |
| API Layer | Hono (v3 routes) + Next.js file-based (v2) | hono ~4.11 | Catch-all `[[...route]]` pattern for v3 |
| Database | PostgreSQL | — | pgvector extension |
| ORM | Prisma | 6.17+ (client), 6.18 (CLI) | Multi-file schema in `src/lib/prisma/schema/` |
| Auth | better-auth | 1.4.18 | `src/lib/auth`, Session/Account models |
| Authorization | Cerbos + OpenFGA | cerbos/http 0.23, @openfga/sdk 0.9 | Policies in `policies/`, authz outbox pattern |
| AI/LLM | Vercel AI SDK, LangChain, Google GenAI, OpenAI | ai 6.0-beta, @google/genai 1.34 | Agent orchestration via LangGraph |
| Rich Text Editor | TipTap | 3.7+ | 15+ extensions |
| Charts | Recharts | 2.15.4 | |
| Drag & Drop | @dnd-kit | core 6.3+ | |
| Flow Diagrams | @xyflow/react | 12.10 | Agent flow editor |
| File Storage | AWS S3 | @aws-sdk/client-s3 3.940 | Presigned URLs |
| Search | Elasticsearch | @elastic/elasticsearch 9.2 | |
| Realtime | Socket.IO | 4.8 | Client + Server |
| Email | Nodemailer | 7.0 | |
| Task Queue/Streaming | KafkaJS | 2.2 | Debezium CDC outbox |
| Logging | Pino | 10.1 | pino-pretty dev |
| Testing | Vitest + Testing Library | vitest 4.0, @testing-library/react 16.3 | JSDOM environment |
| Animations | Motion (framer-motion v12) | 12.23 | |
| Date | date-fns + dayjs | date-fns 4.1, dayjs 1.11 | |
| Form | react-hook-form + @hookform/resolvers | RHF 7.62 | Zod resolvers |
| Validation | Zod | 4.0 | |

---

## 2. Domain Models

### 2.1 Auth Domain (`auth.prisma`)

#### User
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| email | String | @unique |
| name | String | |
| emailVerified | Boolean | |
| image | String? | |
| avatar | String? | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

**Relations**: accounts, sessions, orgMemberships, ownedOrgs, ledTeams, teamMemberships, leadProjects, projectFavorites, assignedIssues, reportedIssues, archivedIssues, comments, activityEvents, aiAgents, sentOrgInvitations

#### Session
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| expiresAt | DateTime | |
| token | String | @unique |
| userId | String | FK → User |
| ipAddress | String? | |
| userAgent | String? | |

#### Account
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| accountId | String | |
| providerId | String | |
| userId | String | FK → User |
| accessToken/refreshToken/idToken | String? | |

#### Verification
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| identifier | String | |
| value | String | |
| expiresAt | DateTime | |

### 2.2 Organization Domain (`organization.prisma`)

#### Organization
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| slug | String | @unique |
| name | String | |
| ownerId | String | FK → User |
| logo | String? | |
| settings | Json | |
| removedAt | DateTime? | Soft delete |

**Relations**: owner, members, invitations, projects, teams, plans, activityEvents

#### OrgMember
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| orgId | String | FK → Organization |
| userId | String | FK → User |
| role | OrgRole | default ORG_MEMBER |

**Enum OrgRole**: `ORG_OWNER`, `ORG_ADMIN`, `ORG_MEMBER`

#### OrgInvitation
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| orgId | String | FK → Organization |
| email | String | |
| role | OrgRole | default ORG_MEMBER |
| status | OrgInvitationStatus | default PENDING |
| token | String | @unique |
| expiresAt | DateTime | |
| revokedAt/acceptedAt/rejectedAt | DateTime? | |
| invitedBy | String | FK → User |

**Enum OrgInvitationStatus**: `PENDING`, `ACCEPTED`, `REJECTED`, `REVOKED`

### 2.3 Project Domain (`project.prisma`)

#### Project
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| orgId | String | FK → Organization |
| leadId | String | FK → User |
| key | String | @@unique([orgId, key]) |
| name | String | |
| type | ProjectType | default SOFTWARE |
| description | String? | |
| avatar | String? | |
| archived | Boolean | default false |
| issueCounter | Int | default 0 |
| sprintCounter | Int | default 0 |

**Relations**: organization, lead, board, issues, statuses, types, priorities, resolutions, actors, roles, favorites, activityEvents

#### ProjectFavorite
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| userId | String | FK → User |
| projectId | String | FK → Project |

#### ProjectRole
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| projectId | String | FK → Project |
| name | String | |
| description | String? | |
| permissions | String[] | default [] |

#### ProjectActor
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| projectId | String | FK → Project |
| actorType | ActorType | USER or TEAM |
| actorId | String | |
| roleId | String | FK → ProjectRole |

**Enum ProjectType**: `SOFTWARE`  
**Enum ActorType**: `USER`, `TEAM`

### 2.4 Issue Domain (`issue.prisma`)

#### Issue
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| key | String | @@unique([projectId, key]) |
| summary | String | |
| description | String? | |
| typeId | String | FK → IssueType |
| statusId | String | FK → IssueStatus |
| priorityId | String | FK → IssuePriority |
| projectId | String | FK → Project |
| resolutionId | String? | FK → IssueResolution |
| reporterId | String? | FK → User |
| assigneeId | String? | FK → User |
| parentId | String? | Self-referencing |
| dueDate/startDate | DateTime? | |
| resolvedAt | DateTime? | |
| archived | Boolean | default false |
| archivedAt | DateTime? | |
| archivedBy | String? | FK → User |
| storyPoints | Float? | |
| originalEstimate | Float? | |
| timeSpent | Float? | |

**Relations**: project, type, status, priority, resolution, reporter, assignee, parent, subIssues, boards, links, linkedBy

#### IssueLink
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| sourceId/targetId | String | FK → Issue |
| linkType | IssueLinkType | BLOCKS/RELATES_TO/DUPLICATES |

#### IssueType
Fields: id, sequence, name, description, iconURL, color, hierarchy, projectId

#### IssueStatus
Fields: id, sequence, name, description, iconURL, color, category (IssueStatusCategory), projectId

#### IssuePriority
Fields: id, sequence, name, description, iconURL, color, projectId

#### IssueResolution
Fields: id, sequence, name, description, iconURL, color, projectId

**Enum IssueStatusCategory**: `TODO`, `IN_PROGRESS`, `DONE`  
**Enum IssueLinkType**: `BLOCKS`, `RELATES_TO`, `DUPLICATES`

### 2.5 Board & Sprint Domain (`board.prisma`)

#### Board
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| projectId | String | @unique, FK → Project |
| name | String? | |
| type | BoardType | SCRUM / KANBAN |
| ownerId | String | |

**Relations**: project, columns, issues, sprints

#### BoardColumn
Fields: id, name, boardId, sequence  
**Relations**: board, statuses (ColumnStatus[])

#### ColumnStatus
Fields: id, columnId (FK → BoardColumn), statusId (FK → IssueStatus)

#### BoardIssue
Fields: issueId (@id), boardId, sprintId?, rank (Decimal)  
**Relations**: board, sprint, issue

#### Sprint
| Field | Type | Constraints |
|-------|------|-------------|
| id | String | @id |
| sequence | Int | default 0 |
| name | String | |
| goal/description | String? | |
| state | SprintState | FUTURE/ACTIVE/CLOSED |
| boardId | String | FK → Board |
| startAt/endAt | DateTime? | Planned dates |
| startedAt/endedAt | DateTime? | Actual dates |
| committedPoints | Decimal? | |

**Relations**: board, boardIssues, userPreferences

#### SprintUserPreference
Fields: id, userId, sprintId, filters (Json), displayProperties (Json), sortOrder

**Enum BoardType**: `SCRUM`, `KANBAN`  
**Enum SprintState**: `FUTURE`, `ACTIVE`, `CLOSED`

### 2.6 Team Domain (`team.prisma`)

#### Team
Fields: id, orgId, leadId?, name, description, avatar  
**Relations**: organization, lead, memberships

#### TeamMember
Fields: teamId+userId (composite PK), createdAt, updatedAt  
**Relations**: team, user

### 2.7 Activity Domain (`activity_event.prisma`)

#### ActivityEvent
Fields: id, orgId, projectId?, actorId?, actorName?, actorType, action, entity, entityId, entityKey?, entityTitle?, changes (Json), metadata (Json), groupKey?, createdAt

**Enum ActivityAction**: CREATED, UPDATED, DELETED, MOVED, ASSIGNED, UNASSIGNED, COMMENTED, LOGGED_TIME, STATUS_CHANGED, SPRINT_STARTED, SPRINT_CLOSED, MEMBER_ADDED, MEMBER_REMOVED, ROLE_CHANGED  
**Enum ActivityEntity**: PROJECT, ISSUE, SPRINT, COMMENT, TEAM, ORGANIZATION

### 2.8 Comment Domain (`comment.prisma`)

#### CommentThread
Fields: id, targetType (ISSUE), targetId  
#### Comment
Fields: id, threadId, content, authorId  
**Enum CommentTargetType**: `ISSUE`

### 2.9 Agent/AI Domain (`agent.prisma`)

#### AIAgent
Fields: id, name, description, ownerId, orgId, tags[], model, instructions, configuration (Json)  
**Relations**: owner, memories, traces, analyses, dataSources

#### DataSource
Fields: id, agentId, sourceType (PROJECT/FILE), sourceId, status, snapshot (Json), isHidden

#### Analysis
Fields: id, agentId, dataSourceId?, runStatus, type (SUMMARY/INSIGHT_EXTRACTION/ANOMALY_DETECTION/ESTIMATION), version, output (Json), metrics (Json)

#### AgentMemory
Fields: id, agentId, content, metadata (Json)

#### AgentTrace
Fields: id, runId, agentId?, userId, input, plan (Json), steps (Json), finalOutput, durationMs, status

### 2.10 Plan Domain (`plan.prisma`)

#### Plan
Fields: id, organizationId, name, startDate, endDate  
**Relations**: organization, scenarios

#### Scenario
Fields: id, name, planId  
**Relations**: plan, issues

#### ScenarioIssue
Fields: id, scenarioId, issueId, targetStart?, targetEnd?, overAssigneeId?

### 2.11 Infrastructure (`schema.prisma`, `outbox.prisma`)

#### DebeziumSignal
Fields: id, type, data (Json) — CDC signal table

#### AuthzOutbox
Fields: id, type, payload (Json), status (PENDING/PROCESSING/DONE/FAILED), attempts, nextRunAt, lastError — Transactional outbox for authorization sync

---

## 3. API Endpoints Inventory

### 3.1 v3 API (Hono catch-all routes)

#### Projects — `/api/v3/projs/`
| Method | Path | Validation | Status |
|--------|------|-----------|--------|
| GET | `/` | ZListProjectsQuery | ✅ Complete |
| POST | `/` | ZProjectCreateInput | ✅ Complete |
| GET | `/facets` | ZFacetsQuery | ✅ Complete |
| GET | `/search` | ZSearchQuery | ✅ Complete |
| GET | `/favorites` | — | ✅ Complete |
| GET | `/:projId` | — | ✅ Complete |
| PATCH | `/:projId` | ZProjectUpdateInput | ✅ Complete |
| DELETE | `/:projId` | — | ✅ Complete |
| GET | `/:projId/summary` | — | ✅ Complete |
| GET | `/:projId/export` | — | ✅ Complete |
| GET | `/:projId/actors` | — | ✅ Complete |
| POST | `/:projId/actors` | ZProjectActorAddInput | ✅ Complete |
| PATCH | `/:projId/actors/:actorId` | ZProjectActorUpdateInput | ✅ Complete |
| DELETE | `/:projId/actors/:actorId` | — | ✅ Complete |
| GET | `/:projId/roles` | — | ✅ Complete |
| POST | `/:projId/roles` | ZProjectRoleCreateInput | ✅ Complete |
| GET | `/:projId/roles/:roleId` | — | ✅ Complete |
| DELETE | `/:projId/roles/:roleId` | — | ✅ Complete |
| GET | `/:projId/issue-statuses` | — | ✅ Complete |
| POST | `/:projId/issue-statuses` | raw JSON | ✅ Complete |
| DELETE | `/:projId/issue-statuses` | query statusId | ✅ Complete |
| GET | `/:projId/members` | — | ✅ Complete |
| POST | `/:projId/members` | ZProjectActorAddInput | ✅ Complete |
| PATCH | `/:projId/members/:memberId` | ZProjectActorUpdateInput | ✅ Complete |
| DELETE | `/:projId/members/:memberId` | — | ✅ Complete |
| GET | `/:projId/states` | — | ✅ Complete |
| POST | `/:projId/archive` | — | ✅ Complete |
| POST | `/:projId/unarchive` | — | ✅ Complete |
| POST | `/:projId/favorites` | — | ✅ Complete |
| DELETE | `/:projId/favorites` | — | ✅ Complete |

#### Organizations + Teams — `/api/v3/orgs/`
| Method | Path | Validation | Status |
|--------|------|-----------|--------|
| GET | `/` | — | ✅ Complete |
| POST | `/` | raw JSON | ✅ Complete |
| GET | `/:orgId` | ZGetByQuery | ✅ Complete |
| PATCH | `/:orgId` | ZOrgUpdateInput | ✅ Complete |
| DELETE | `/:orgId` | — | ✅ Complete |
| POST | `/slug-available` | {slug} | ✅ Complete |
| GET | `/:orgId/members` | — | ✅ Complete |
| POST | `/:orgId/members/invite` | ZOrgMemberInviteInput | ✅ Complete |
| GET | `/invitations/preview` | {token} | ✅ Complete |
| GET | `/:orgId/invitations` | — | ✅ Complete |
| POST | `/invitations/accept` | {token} | ✅ Complete |
| POST | `/:orgId/invitations/revoke` | {email} | ✅ Complete |
| POST | `/:orgId/invitations/resend` | {email} | ✅ Complete |
| PATCH | `/:orgId/members/:userId` | {role} | ✅ Complete |
| DELETE | `/:orgId/members/me` | — | ✅ Complete |
| DELETE | `/:orgId/members/:userId` | — | ✅ Complete |
| GET | `/:orgId/teams` | — | ✅ Complete |
| POST | `/:orgId/teams` | ZTeamCreateInput | ✅ Complete |
| GET | `/:orgId/teams/:teamId` | — | ✅ Complete |
| PATCH | `/:orgId/teams/:teamId` | ZTeamUpdateInput | ✅ Complete |
| DELETE | `/:orgId/teams/:teamId` | — | ✅ Complete |
| GET | `/:orgId/teams/:teamId/members` | — | ✅ Complete |
| POST | `/:orgId/teams/:teamId/members` | {userIds} | ✅ Complete |
| DELETE | `/:orgId/teams/:teamId/members/:userId` | — | ✅ Complete |

#### Boards — `/api/v3/boards/`
| Method | Path | Validation | Status |
|--------|------|-----------|--------|
| GET | `/:boardId` | — | ✅ Complete |
| GET | `/:boardId/columns` | — | ✅ Complete |
| POST | `/:boardId/columns` | ZColumnCreateInput | 🔧 Stub (returns dummy) |
| POST | `/:boardId/columns:reorder` | {ids} | 🔧 Stub |
| GET | `/:boardId/issues` | ZBoardIssueQueryParams (qs) | ✅ Complete |
| POST | `/:boardId/issues` | ZBoardIssueCreateInput | ✅ Complete |
| GET | `/:boardId/issues:facets` | — | ✅ Complete |
| GET | `/:boardId/issues/:issueId` | — | ✅ Complete |
| PATCH | `/:boardId/issues/:issueId` | ZBoardIssueUpdateInput | ✅ Complete |
| DELETE | `/:boardId/issues/:issueId` | — | ✅ Complete |
| POST | `/:boardId/issues:move` | ZMoveIssueInputV2 | ✅ Complete |
| POST | `/:boardId/issues/:issueId/move` | ZBoardIssueMoveInput | ✅ Complete |
| POST | `/:boardId/issues:reorder` | ZBoardIssueRankUpdate | ✅ Complete |
| GET | `/:boardId/sprints/:sprintId` | — | ✅ Complete |
| POST | `/:boardId/sprints` | raw JSON | ✅ Complete |
| PATCH | `/:boardId/sprints/:sprintId` | ZSprintUpdateInput | ✅ Complete |
| DELETE | `/:boardId/sprints/:sprintId` | — | ✅ Complete |
| POST | `/:boardId/sprints/:sprintId/start` | — | ✅ Complete |
| POST | `/:boardId/sprints/:sprintId/complete` | ZBoardSprintCompleteInput | ✅ Complete |

#### Sprints — `/api/v3/sprints/`
| Method | Path | Validation | Status |
|--------|------|-----------|--------|
| GET | `/` | ZSprintListQuery (boardId/projectId/state) | ✅ Complete |
| POST | `/` | ZSprintCreateInput | ✅ Complete |
| GET | `/:sprintId` | — | ✅ Complete |
| PATCH | `/:sprintId` | ZSprintUpdateInput | ✅ Complete |
| DELETE | `/:sprintId` | — | ✅ Complete |
| POST | `/:sprintId/start` | — | ✅ Complete |
| POST | `/:sprintId/complete` | ZSprintCompleteInput | ✅ Complete |
| GET | `/:sprintId/issues` | — | ✅ Complete |
| POST | `/:sprintId/issues` | ZSprintAddIssuesInput | ✅ Complete |
| DELETE | `/:sprintId/issues/:issueId` | — | ✅ Complete |
| GET | `/:sprintId/reports` | ZReportQuery (type) | ✅ Complete |
| GET | `/:sprintId/summary` | — | ✅ Complete |
| GET | `/:sprintId/user-preferences` | — | ✅ Complete |
| PATCH | `/:sprintId/user-preferences` | ZSprintUserPreferenceInput | ✅ Complete |
| GET | `/:sprintId/analytics` | — | ✅ Complete |
| POST | `/:sprintId/transfer` | ZSprintTransferInput | ✅ Complete |

#### Activity — `/api/v3/activity/`
| Method | Path | Validation | Status |
|--------|------|-----------|--------|
| GET | `/` | ZActivityFeedQuery | ✅ Complete |

#### Me — `/api/v3/me/`
| Method | Path | Validation | Status |
|--------|------|-----------|--------|
| GET | `/` | — | ✅ Complete |
| PUT | `/` | ZMeUpdateInput | ✅ Complete |
| PATCH | `/` | ZMeUpdateInput | ✅ Complete |
| GET | `/orgs/invitees` | — | ✅ Complete |
| GET | `/orgs/invitees/:orgId` | ZOrgInviteAcceptInput | ❌ Broken (throws "Not implemented") |
| POST | `/orgs/invitees/accept` | ZOrgInviteAcceptInput | ✅ Complete |
| POST | `/orgs/invitees/reject` | ZOrgInviteRejectInput | ❌ Broken (uses undefined `auth`) |
| GET | `/orgs/invite` | {token} query | ✅ Complete |
| POST | `/orgs/:orgId/invite/accept` | {token} query | ❌ Broken (uses `getAuthFromRequestHono`) |
| POST | `/orgs/:orgId/invite/reject` | {token} query | ❌ Broken (uses `getAuthFromRequestHono`) |

#### Auth — `/api/v3/auth/`
| Method | Path | Status |
|--------|------|--------|
| GET/POST | `/*` | ✅ Complete (better-auth handler) |

### 3.2 v2 API (Legacy, Next.js file-based routes)

**53 route files** across: agents (8), auth (1), authz (6), collab (1), issues (1), projects (13), search (1), sprints (6), star (3), workspaces (13)

> [!WARNING]
> v2 routes are legacy. Teams v2 routes were recently deleted and migrated to v3. Other v2 routes are still active.

### 3.3 AI Endpoints
| Path | Purpose |
|------|---------|
| `/api/ai/agent-chain` | Agent chain execution |
| `/api/ai/chat` | AI chat (spec-agent) |
| `/api/ai/file/upload-url` | AI file upload presign |
| `/api/ai/project/generate` | AI project generation |
| `/api/ai/project/generate-v2` | AI project generation v2 |
| `/api/ai/suggestions` | AI suggestions |

### 3.4 System/Utility Endpoints
| Path | Purpose |
|------|---------|
| `/api/system/backfill-issues` | Issue data backfill |
| `/api/system/consumers` | CDC consumers |
| `/api/system/debezium` | Debezium connector |
| `/api/ui/breadcrumbs` | UI breadcrumb data |
| `/api/uploads/presign` | S3 presigned upload |
| `/api/avatar/[key]` | Avatar serving |
| `/api/avatar/upload-url` | Avatar upload presign |
| `/api/demo/*` | Demo agents |

---

## 4. Frontend Modules

### 4.1 Page Routes (`src/app/(authed)/`)

| Route | Purpose | API Consumed |
|-------|---------|-------------|
| `/o/[orgSlug]/projs` | Project list | v3 projs |
| `/o/[orgSlug]/projs/[projId]` | Project detail (board) | v3 projs, boards |
| `/o/[orgSlug]/sprints` | Sprint list | v3 sprints |
| `/o/[orgSlug]/sprints/[sprintId]` | Sprint detail (kanban/list/summary/reports) | v3 sprints, boards |
| `/o/[orgSlug]/teams` | Team list | v3 orgs/:orgId/teams |
| `/o/[orgSlug]/teams/[teamId]` | Team detail | v3 orgs/:orgId/teams |
| `/o/[orgSlug]/agents/` | Agent list | v2 agents |
| `/o/[orgSlug]/agents/[agentId]` | Agent detail (analytics, edit, flow) | v2 agents |
| `/o/[orgSlug]/agents/new` | Create agent | v2 agents |
| `/o/[orgSlug]/agents/traces` | Agent traces | v2 workspaces |
| `/o/[orgSlug]/starred` | Starred issues | v2 star |
| `/o/(settings)/[orgSlug]/settings/members` | Org members management | v3 orgs |
| `/o/(settings)/[orgSlug]/settings/ai` | AI settings | v2 agents |
| `/orgs` | Org list/create | v3 orgs |
| `/invite` | Org invite page | v3 me |
| `/accept-invite` | Accept invitation | v3 me |
| `/user/profile` | User profile | v3 me |

### 4.2 Feature Modules (`src/features/`)

| Module | Sub-folders | Purpose |
|--------|-----------|---------|
| `activity` | __tests__, api, server, ui | Activity feed rendering |
| `agents` | api, hooks, server, stores, types, ui, utils | AI agent CRUD, analysis, orchestration |
| `ai` | agents/, groomer-agent/, insightmate/, tools/ | AI services (prioritization, estimation, groomer) |
| `authn` | __tests__, api, helper, server, ui | Authentication flows |
| `boards` | api, hooks, server, ui | Board CRUD, issue management, kanban |
| `collab` | server, ui | Comments/threads collaboration |
| `foryou` | api | Personal dashboard ("For You" feed) |
| `organization` | __tests__, api, server, stores, types, ui, utils | Org CRUD, members, invitations |
| `project` | api, server, stores, types, ui, utils | Project CRUD (v2 services) |
| `project_v3` | server | Project services (v3 pattern) |
| `query` | server | CQRS query handlers (issue list, status list, search) |
| `sprints` | server | Sprint CRUD, lifecycle, analytics |
| `teams` | api, server | Team CRUD, members |
| `user` | — | User-related features |

> [!NOTE]
> `project` and `project_v3` coexist — `project_v3` has new service layer while `project` retains the frontend API hooks and v2 services.

### 4.3 Shared Components (`src/components/`)
Headers, issue-star-button, AI elements (queue, chat), various shared UI.

### 4.4 Layouts (`src/layouts/`)
App rightbar layout with sidebar integration.

---

## 5. Feature Completeness Map

| Feature Area | Status | Notes |
|-------------|--------|-------|
| Auth (login/register/session) | ✅ Complete | better-auth, v3 |
| Organizations CRUD | ✅ Complete | v3 |
| Org Members & Invitations | ✅ Complete | v3 |
| Teams CRUD | ✅ Complete | v3 (recently migrated) |
| Teams Members | ✅ Complete | v3 |
| Projects CRUD | ✅ Complete | v3 |
| Project Archive/Unarchive | ✅ Complete | v3 |
| Project Favorites | ✅ Complete | v3 |
| Project Roles & Actors | ✅ Complete | v3 |
| Project Members | ✅ Complete | v3 |
| Issues CRUD | ✅ Complete | via boards v3 |
| Issue Types/Statuses/Priorities | ✅ Complete | v3 |
| Issue Links | 🔧 Partial | Model exists, no dedicated v3 endpoint |
| Issue Sub-issues | 🔧 Partial | Model supports hierarchy, limited UI |
| Boards (Kanban/Scrum) | ✅ Complete | v3 |
| Board Columns | 🔧 Partial | Create/reorder are stubs |
| Issue Drag & Drop (move/reorder) | ✅ Complete | v3 |
| Sprints CRUD | ✅ Complete | v3 |
| Sprint Lifecycle (start/complete) | ✅ Complete | v3 |
| Sprint Issues Management | ✅ Complete | v3 |
| Sprint Reports (burndown/burnup) | ✅ Complete | v3 |
| Sprint Summary | ✅ Complete | v3 |
| Sprint Analytics | ✅ Complete | v3 |
| Sprint Transfer | ✅ Complete | v3 |
| Sprint User Preferences | ✅ Complete | v3 |
| Activity Feed | ✅ Complete | v3 |
| Comments/Threads | 🔧 Partial | v2 collab route only |
| AI Agents (CRUD) | ✅ Complete | v2 |
| AI Data Sources | ✅ Complete | v2 |
| AI Analysis | ✅ Complete | v2 |
| AI Chat/Agent Chain | ✅ Complete | /api/ai |
| AI Project Generation | ✅ Complete | /api/ai |
| Starred Issues | 🔧 Partial | v2 star routes |
| Project Export | ✅ Complete | v3 |
| Search | 🔧 Partial | v2 search + v3 project search |
| Plans & Scenarios | 🔧 Partial | Model exists, v2 routes |
| Modules | ❌ Not started | No model or endpoint |
| Views (saved filters) | ❌ Not started | No model or endpoint |
| Pages/Wiki | ❌ Not started | No model or endpoint |
| Intake/Inbox | ❌ Not started | No model or endpoint |
| Notifications | ❌ Not started | No model or endpoint |
| Webhooks | ❌ Not started | No model or endpoint |
| Labels | ❌ Not started | No model or endpoint |
| Estimates | ❌ Not started | No model per se (AI estimation only) |
| Analytics Dashboard | 🔧 Partial | Sprint analytics exists, no org-level |

---

## 6. Known Technical Debt

### 6.1 Broken Code
- **`/api/v3/me` route**: Uses undefined `getAuthFromRequestHono` in 3 endpoints (invite accept/reject, invitees/:orgId). Uses undefined `auth` variable in `/orgs/invitees/reject`.
- **`features/teams/api/actionts.ts`**: Typo in filename (should be `actions.ts`), contains TODO.

### 6.2 TODOs & FIXMEs
73+ files contain TODO/FIXME/HACK markers, including:
- `components/headers/project-header.tsx`
- `components/issue-star-button.tsx`
- `lib/http/filters/index.ts`
- `lib/utils/lexorank-num.ts`
- `contracts/issues/issue.ts`
- `contracts/boards/board.query.ts`, `column.input.ts`, `board.input.ts`
- `features/query/server/cqrs/q-issue-list.ts`, `q-search-v1.ts`
- `features/agents/server/orchestrator.ts`
- Various sprint tab components with mock data files
- `features/organization/server/org.service.ts`
- `features/project/server/project-field.service.ts`

### 6.3 Mock Data
- `sprints/[sprintId]/mock-data.ts` and `mock-data-3.tsx` — mock data in production pages

### 6.4 Architectural Inconsistencies
- **Dual project modules**: `features/project` (v2) and `features/project_v3` coexist
- **Mixed API versions**: Frontend still uses some v2 endpoints (agents, star, search, workspaces, comments)
- **Board columns**: Create and reorder return dummy/stub responses
- **Comments**: Only v2 collab route, not migrated to v3
- **Plans**: Model exists but implementation appears minimal

### 6.5 v2 Routes Still Active
agents, authz (invitations), collab, issues, projects (some), search, sprints (some), star, workspaces — all still have v2 routes
