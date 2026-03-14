# Main Project Features 

## 1. Project Information
- **Name**: Insightimate
- **Purpose**: AI-powered project management platform designed for software development teams and product teams (startups to SMBs). It provides AI-assisted issue triage, planning, estimation, and real-time collaboration through intelligent agents.

## 2. Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 19, TailwindCSS 4, Radix UI, TanStack Query/Table
- **Backend**: Next.js API Routes (`/api/v2`, `/api/v3`), Prisma ORM
- **Database**: PostgreSQL 17 with pgvector (via Prisma)
- **AI/LLM**: Google Gemini, OpenAI, LangChain, Vercel AI SDK
- **Authorization**: Cerbos (ABAC) + OpenFGA (ReBAC)
- **File Storage**: MinIO (S3-compatible)
- **Real-time**: Socket.io

## 3. Domain Models (Prisma)
- **Activity**: `ActivityEvent`
- **Agents**: `AgentSession`, `AgentMessage`, `FeatureAgentConfig`
- **Auth**: `User`, `Session`, `Account`, `Verification`
- **Boards**: `Board`, `BoardList`, `BoardFilter`
- **Collaboration**: `Comment`, `CommentReaction`
- **Issues**: `Issue`, `IssueAssignee`, `IssueLabel`, `CustomLabel`, `IssueRelation`, `IssueBlocker`
- **Organizations**: `Organization`, `OrganizationMember`, `Subscription`
- **System**: `OutboxEvent`, `DebeziumSignal`
- **Planning**: `Plan`, `PlanPhase`
- **Projects**: `Project`, `ProjectMember`, `ProjectFeature`, `ProjectState`, `ProjectLabel`
- **Teams**: `Team`, `TeamMember`

## 4. Routes and API Endpoints

### Pages / Routes
- **Auth**: `/signin`, `/signup`
- **Organizations**: `/orgs`, `/invite`, `/accept-invite`, `/o/[orgSlug]`
- **Org Settings**: `/o/(settings)/[orgSlug]/settings`, `/o/(settings)/[orgSlug]/settings/members`
- **Projects**: `/o/[orgSlug]/projs`, `/o/[orgSlug]/projs/[projId]`
- **Sprints**: `/o/[orgSlug]/sprints/[sprintId]`
- **Teams**: `/o/[orgSlug]/teams`, `/o/[orgSlug]/teams/[teamId]`
- **AI Agents**: `/o/[orgSlug]/agents`, `/o/[orgSlug]/agents/new`, `/o/[orgSlug]/agents/[agentId]`, `/o/[orgSlug]/agents/[agentId]/edit`, `/o/[orgSlug]/agents/[agentId]/analytics/[analyzeId]`, `/o/[orgSlug]/agents/traces`
- **Other**: `/user/profile`, `/o/[orgSlug]/starred`

### API Endpoints
- **v2 API (`/api/v2/*`)**:
  - `sprints/*` (CRUD, reports, burndown, summary)
  - `agents/*` (chat, sources, analyses)
  - `issues/`
  - `collab/threads/*`
  - `projects/*` (roles, members, states, issue-statuses, summary, export)
  - `auth/*`, `authz/*` (invitations, candidates)
  - `workspaces/*` (members, projects/import, foryou, agents)
  - `teams/*`
  - `star/*`
  - `search/`
- **v3 API (`/api/v3/*`)**:
  - `boards/[[...route]]`
  - `orgs/[[...route]]`
  - `activity/[[...route]]`
  - `auth/[[...route]]`
  - `me/[[...route]]`
  - `projs/[[...route]]`
- **System / AI / Demo**:
  - `/api/ai/*` (chat, project/generate, file/upload-url, agent-chain, suggestions)
  - `/api/system/*` (debezium, consumers, backfill-issues)
  - `/api/avatar/*`

## 5. Feature Implementation Status

### ✅ Fully Implemented
- **Authentication & Authorization**: Cerbos + OpenFGA fully integrated, Auth pages exist.
- **Organization (Workspace)**: Creation, member management, invitations.
- **Projects**: Basic CRUD, states, membership, roles (being migrated to v3 APIs).
- **AI Agents**: Extensive endpoints for creating, editing, and interacting with AI agents, uploading sources, tracing, and analysis.
- **Boards**: Kanban layout, issue rendering.

### ⚠️ Partially Implemented
- **Issues**: Exists in DB and API, but deeply intertwined with Boards/Projects. Full standalone issue detail pages might be lacking compared to Plane.
- **Sprints (Cycles)**: Basic sprint views and reports exist (`/sprints/[sprintId]`), but full management might be incomplete.
- **Teams**: Exists in API and UI pages (`/teams/[teamId]`), but feature parity is basic.
- **Collaboration**: Comments and reactions exist in DB, but rich text TipTap syncing might be basic compared to Plane.
- **Activity Logs**: Infrastructure (Debezium, OutboxEvent, ActivityEvent) and v3 endpoints exist, but comprehensive history rendering might not be complete.

### ❌ Planned but Missing
- **Modules (Features/Epics)**: No domain models or routes.
- **Pages (Documentation)**: Deep knowledge base integration missing.
- **Intake (Inbox)**: Not implemented yet.
- **Advanced Views (Filters)**: Custom saved views missing (though BoardFilter exists).
- **Global Analytics**: Missing beyond basic agent analytics.
