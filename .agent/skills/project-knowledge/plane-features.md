# Plane Reference — Feature Inventory

> **Last scanned**: 2026-03-16  
> **Path**: `./plane/` (Read-Only)  
> **Stack**: Django REST Framework (Python), Next.js (React), Turborepo monorepo

---

## 1. Architecture Overview

### Backend (`apps/api/plane/`)
- **Framework**: Django REST Framework
- **Structure**: `app/views/` (17 view modules), `api/views/` (13 public API views), `api/urls/` (12 URL pattern groups)
- **Auth**: Custom authentication middleware + DRF permission classes
- **Task Queue**: Celery (`plane/celery.py`) with background tasks (`plane/bgtasks/`)
- **Database**: PostgreSQL with Django ORM (`plane/db/`)

### Frontend (`apps/web/`)
- **Framework**: Next.js (App Router)
- **Routing**: `app/(all)/[workspaceSlug]/` → workspace-scoped pages
- **State**: Mobx stores via `packages/shared-state/`

### Packages (`packages/`)
- `services/` — API service layer
- `types/` — TypeScript type definitions
- `ui/` — Shared UI components
- `editor/` — Rich text editor
- `hooks/` — Shared React hooks
- `constants/` — App constants
- `i18n/` — Internationalization
- `utils/` — Shared utilities
- `propel/` — Propel modules
- `logger/` — Logging

---

## 2. API Surface

### URL Pattern Groups (from `api/urls/__init__.py`)
1. **asset** — File/image asset management
2. **cycle** — Sprint/cycle CRUD and lifecycle
3. **intake** — Inbox/intake issue triaging
4. **label** — Issue label management
5. **member** — Workspace and project membership
6. **module** — Module (feature group) management
7. **project** — Project CRUD and configuration
8. **state** — Issue state management
9. **user** — User profile and preferences
10. **work_item** — Issue/work item CRUD
11. **invite** — Workspace invitation flow
12. **sticky** — Personal sticky notes

### Internal View Modules (`app/views/`)
analytics, asset, cycle, estimate, exporter, external, intake, issue, module, notification, page, project, search, state, timezone, user, view, webhook, workspace

### Common Patterns
- **ViewSet pattern**: DRF ModelViewSet with mixins
- **Workspace-scoped URLs**: `/api/workspaces/<slug>/projects/<id>/...`
- **Permissions**: Custom permission classes per view
- **Pagination**: DRF LimitOffsetPagination
- **Filtering**: DRF FilterBackend with custom filters
- **Bulk operations**: Dedicated bulk endpoints (e.g., bulk create/update issues)
- **Serializers**: Input and output serializers per model, nested serializers for related data

---

## 3. Feature Areas

### 3.1 Projects
- **Endpoints**: Full CRUD on `/api/workspaces/<slug>/projects/`
- **Features**: Create, update, delete, archive, list, detail, search
- **Configuration**: Network type (public/private/secret), emoji, cover image, module/cycle/intake toggles
- **Members**: ProjectMember with integer roles (Guest=5, Viewer=10, Member=15, Admin=20)
- **Design**: Workspace-scoped, supports project-level settings and feature toggles

### 3.2 Issues / Work Items
- **Endpoints**: Full CRUD on `.../projects/<id>/work-items/`
- **Features**: Create, update, delete, list, detail, sub-issues, bulk operations
- **Fields**: title, description, state, priority, assignees (multiple), labels, start_date, target_date, sort_order, estimate_point
- **Sub-issues**: Parent-child relationship with `parent_id`
- **Bulk ops**: Bulk create, bulk update, bulk archive/delete
- **Relations**: Issue links, issue activities, issue comments
- **Subscribers**: Issue notification subscribers
- **Design**: Uses `sort_order` for ordering. Supports multiple assignees (vs Main's single assignee)

### 3.3 Cycles (Sprints)
- **Endpoints**: Full CRUD on `.../projects/<id>/cycles/`
- **Features**: Create, update, delete, list, active cycle, cycle issues, transfer
- **Lifecycle**: Draft → Active → Complete (implicit via dates)
- **Active cycles**: Dedicated endpoint for current active cycle
- **Transfer**: Move incomplete items to next cycle on completion
- **Favorites**: Users can favorite cycles
- **Analytics**: Cycle progress, burndown data
- **Design**: Project-scoped, supports multiple active cycles

### 3.4 Modules
- **Endpoints**: Full CRUD on `.../projects/<id>/modules/`
- **Features**: Create, update, delete, list, module issues, favorites
- **Purpose**: Group issues by feature, initiative, or workstream
- **Module Issues**: Many-to-many between modules and issues
- **Status**: Backlog, Planned, In Progress, Paused, Completed, Cancelled
- **Design**: Similar to cycles but for non-time-boxed grouping

### 3.5 Intake (Inbox)
- **Endpoints**: `.../projects/<id>/intake/`
- **Features**: Submit issues for triage, accept/reject/snooze/duplicate
- **Status**: Pending → Accepted/Rejected/Snoozed/Duplicated
- **Design**: Triage workflow for external or unvetted issue submissions

### 3.6 Views
- **Endpoints**: `.../projects/<id>/views/` and workspace-level views
- **Features**: Saved filtered/sorted issue lists
- **Filters**: Status, priority, assignee, label, date ranges
- **Sharing**: Can be shared with workspace members
- **Design**: Supports both project-level and workspace-level views

### 3.7 Pages
- **Endpoints**: `.../projects/<id>/pages/`
- **Features**: Wiki/documentation pages with rich text content
- **Editor**: ProseMirror-based rich text (shared `packages/editor/`)
- **Features**: Page tree, nested pages, favorites, sharing
- **Design**: Project-scoped documentation system

### 3.8 Members & Permissions
- **Workspace Members**: CRUD, role assignment, invitations
- **Project Members**: CRUD, role assignment, leave/join
- **Roles**: Integer-based (Guest=5, Viewer=10, Member=15, Admin=20)
- **Invitations**: Email-based invite flow with acceptance/rejection
- **Design**: Workspace → Project two-level membership hierarchy

### 3.9 Analytics
- **Endpoints**: Dedicated analytics views
- **Features**: Custom analytics (group by, x-axis, y-axis), default analytics
- **Scope**: Workspace-level and project-level
- **Charts**: Issues by status, priority, assignee, estimates, dates
- **Design**: Configurable analytics engine with grouping/aggregation

### 3.10 Activity Feed / History
- **Model**: `IssueActivity` — tracks all changes to issues
- **Fields**: field changed, old_value, new_value, actor, timestamp
- **Scope**: Issue-level activity log
- **Design**: Field-by-field change tracking with human-readable diff

### 3.11 States
- **Endpoints**: `.../projects/<id>/states/`
- **Features**: Custom states per project
- **Groups**: backlog, unstarted, started, completed, cancelled
- **Design**: Project-scoped, each state maps to one of 5 groups

### 3.12 Labels
- **Endpoints**: `.../projects/<id>/labels/` and workspace labels
- **Features**: Color-coded labels, workspace and project scope
- **Design**: Hierarchical (parent-child) label support

### 3.13 Estimates
- **Endpoints**: `.../projects/<id>/estimates/`
- **Features**: Custom estimate point configurations
- **Types**: Points, categories, time
- **Design**: Project-level estimate configuration with point scales

### 3.14 Notifications
- **Endpoints**: Notification views in `app/views/notification/`
- **Features**: In-app notifications for issue updates, mentions, assignments
- **Design**: User-specific notification feed with read/unread state

### 3.15 Webhooks
- **Endpoints**: Webhook views in `app/views/webhook/`
- **Features**: Custom webhook integrations for external services
- **Events**: Issue create/update/delete, member changes, etc.
- **Design**: Workspace-level webhook configuration

### 3.16 Assets
- **Endpoints**: Asset upload/download
- **Features**: File attachments for issues, pages, user avatars
- **Storage**: S3-compatible storage
- **Design**: Presigned URL upload pattern

### 3.17 Search
- **Endpoints**: Search views
- **Features**: Global search across workspace entities
- **Scope**: Issues, projects, pages, cycles, modules
- **Design**: In-app search with workspace context

### 3.18 Stickies
- **Endpoints**: Sticky CRUD
- **Features**: Personal quick notes / sticky notes
- **Design**: User-scoped, lightweight note-taking

---

## 4. Frontend Page Structure

### Web App Routes (`apps/web/app/(all)/[workspaceSlug]/`)

| Route | Feature |
|-------|---------|
| `(projects)/projects/(list)` | Project list |
| `(projects)/projects/(detail)` | Project detail |
| `(projects)/browse/` | Browse issues |
| `(projects)/browse/[workItem]` | Single work item |
| `(projects)/active-cycles/` | Active cycles overview |
| `(projects)/analytics/[tabId]` | Analytics dashboard |
| `(projects)/drafts/` | Draft issues |
| `(projects)/notifications/` | Notification center |
| `(projects)/profile/[userId]` | User profile |
| `(projects)/stickies/` | Sticky notes |
| `(projects)/workspace-views/[globalViewId]` | Workspace-level views |
| `(settings)/` | Workspace settings |
