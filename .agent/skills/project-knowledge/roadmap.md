# Implementation Roadmap

> **Last updated**: 2026-03-16  
> **Based on**: `gap-analysis.md`

---

## Phase 1 — Critical (Blockers & Foundation)

### Item 1.1 — Fix Broken Me Endpoints
```
Status:       Not Started
Gap ref:      G17
Plane ref:    n/a (bug fix)
Effort:       S
Dependencies: None
Notes:        4 endpoints in /api/v3/me/ use undefined getAuthFromRequestHono
              or undefined auth variable. Quick fix to use getUserAndThrow.
```

### Item 1.2 — Notifications System
```
Status:       Not Started
Gap ref:      G6
Plane ref:    ./plane/apps/api/plane/app/views/notification/
Effort:       XL
Dependencies: None
Notes:        Users need alerts for assignments, mentions, status changes.
              Requires: Notification model, preference settings, in-app feed,
              email integration (Nodemailer already available).
              Consider Socket.IO for real-time push.
```

### Item 1.3 — Labels
```
Status:       Not Started
Gap ref:      G1
Plane ref:    ./plane/apps/api/plane/api/urls/label.py
              ./plane/apps/api/plane/api/views/issue.py
Effort:       M
Dependencies: None
Notes:        Add Label model (project-scoped, color, name).
              Add label[] field to Issue model (M2M).
              v3 endpoints: CRUD + assign/remove from issues.
              UI: Label picker in issue detail, label filter in board.
```

---

## Phase 2 — Core Features (User-Facing Functionality)

### Item 2.1 — Comments Migration to v3
```
Status:       Not Started
Gap ref:      G10
Plane ref:    ./plane/apps/api/plane/app/views/issue/ (IssueComment)
Effort:       M
Dependencies: None
Notes:        Migrate collab/thread endpoints from v2 to v3 Hono.
              CommentThread + Comment models already exist.
              Add v3 routes, update frontend API hooks.
```

### Item 2.2 — Multi-Assignee Support
```
Status:       Not Started
Gap ref:      G9
Plane ref:    ./plane/packages/types/ (IssueAssignee M2M)
Effort:       L
Dependencies: None
Notes:        Current Issue has single assigneeId.
              Need IssueAssignee M2M model, update all issue
              create/update/list endpoints, update UI assignee picker.
              Breaking change to issue contracts.
```

### Item 2.3 — Unified Search (v3)
```
Status:       Not Started
Gap ref:      G12
Plane ref:    ./plane/apps/api/plane/app/views/search/
Effort:       M
Dependencies: None
Notes:        Consolidate v2 search + v3 project search into unified
              /api/v3/search endpoint. Search across issues, projects,
              members. Leverage existing Elasticsearch.
```

### Item 2.4 — Views (Saved Filters)
```
Status:       Not Started
Gap ref:      G3
Plane ref:    ./plane/apps/api/plane/app/views/view/
Effort:       L
Dependencies: G1 (Labels for filter criteria)
Notes:        New View model with saved filter/sort/group config.
              Project-scoped and org-scoped views.
              Share views with team members.
```

### Item 2.5 — Board Column Management
```
Status:       In Progress (stubs exist)
Gap ref:      G11
Plane ref:    n/a (Main has explicit Board model, Plane doesn't)
Effort:       S
Dependencies: None
Notes:        Replace stub responses in v3 boards route with actual
              column create/reorder implementation. Models already exist.
```

### Item 2.6 — Starred Issues Migration to v3
```
Status:       Not Started
Gap ref:      G15
Plane ref:    n/a
Effort:       S
Dependencies: None
Notes:        Migrate v2 star routes to v3 Hono pattern.
              Consider generalizing to UserFavorite (as Plane does).
```

---

## Phase 3 — Advanced Features (Power User)

### Item 3.1 — Modules
```
Status:       Not Started
Gap ref:      G2
Plane ref:    ./plane/apps/api/plane/api/urls/module.py
              ./plane/apps/api/plane/api/views/module.py
Effort:       L
Dependencies: None
Notes:        New Module model (project-scoped, name, description, status,
              start_date, target_date). ModuleIssue M2M.
              Endpoints: CRUD + add/remove issues.
              UI: Module list, module detail, add issues to module.
```

### Item 3.2 — Intake / Inbox
```
Status:       Not Started
Gap ref:      G4
Plane ref:    ./plane/apps/api/plane/api/urls/intake.py
              ./plane/apps/api/plane/api/views/intake.py
Effort:       L
Dependencies: None
Notes:        Triage workflow for incoming issues.
              IntakeIssue model with status (pending/accepted/rejected/snoozed).
              UI: Inbox view, triage actions.
```

### Item 3.3 — Estimates Configuration
```
Status:       Not Started
Gap ref:      G8
Plane ref:    ./plane/apps/api/plane/app/views/estimate/
Effort:       M
Dependencies: None
Notes:        EstimateConfig model per project (point scale definition).
              UI for configuring estimate points.
              Issue.storyPoints field already exists.
```

### Item 3.4 — Analytics Dashboard
```
Status:       Not Started
Gap ref:      G13
Plane ref:    ./plane/apps/api/plane/analytics/
Effort:       L
Dependencies: None
Notes:        Org-level analytics with configurable grouping.
              Issues by status/priority/assignee/type over time.
              Recharts already available for frontend charts.
```

### Item 3.5 — Pages / Wiki
```
Status:       Not Started
Gap ref:      G5
Plane ref:    ./plane/apps/api/plane/app/views/page/
Effort:       XL
Dependencies: None
Notes:        Page model with rich text content (TipTap already used).
              Page tree/hierarchy, nested pages, favorites.
              Full CRUD + sharing + search integration.
```

### Item 3.6 — AI Agents Migration to v3
```
Status:       Not Started
Gap ref:      G14
Plane ref:    n/a (Main-only feature)
Effort:       L
Dependencies: None
Notes:        Migrate all 8 v2 agent routes to v3 Hono pattern.
              Maintain backward compat during migration.
```

---

## Phase 4 — Polish & Optimization

### Item 4.1 — Webhooks
```
Status:       Not Started
Gap ref:      G7
Plane ref:    ./plane/apps/api/plane/app/views/webhook/
Effort:       L
Dependencies: G6 (Notifications infrastructure)
Notes:        Webhook model per org, event subscription config.
              Push webhook payloads on events (issue CRUD, member changes).
```

### Item 4.2 — Stickies / Quick Notes
```
Status:       Not Started
Gap ref:      G16
Plane ref:    ./plane/apps/api/plane/api/urls/sticky.py
Effort:       S
Dependencies: None
Notes:        Personal quick notes feature. Low priority but easy to add.
```

### Item 4.3 — v2 Route Cleanup
```
Status:       Not Started
Gap ref:      Multiple (G10, G12, G14, G15)
Effort:       M
Dependencies: All v3 migrations in Phase 2 and 3
Notes:        Once all features migrated to v3, delete remaining v2 routes.
              Ensure frontend is fully migrated.
              Clean up dual project/project_v3 module structure.
```

### Item 4.4 — Technical Debt Cleanup
```
Status:       Not Started
Gap ref:      main-features.md §6
Effort:       M
Dependencies: None
Notes:        - Remove mock data files from sprint pages
              - Fix teams/api/actionts.ts filename typo
              - Consolidate project + project_v3 feature modules
              - Address 73+ TODO/FIXME markers
              - Clear stub board column endpoints
```

---

## Phase Summary

| Phase | Items | Total Effort |
|-------|-------|-------------|
| Phase 1 — Critical | 3 | S + XL + M |
| Phase 2 — Core Features | 6 | M + L + M + L + S + S |
| Phase 3 — Advanced Features | 6 | L + L + M + L + XL + L |
| Phase 4 — Polish | 4 | L + S + M + M |
| **Total** | **19 items** | |
