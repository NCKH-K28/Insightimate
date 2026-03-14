# Plane Ref Project Features

## 1. Complete Feature List (By Module)

### Workspace Module (Organizations)
- **Description**: General settings, Member management, Billing, Exports, Webhooks. Global views and analytics tracking at the organizational level.
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/workspace/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/`

### Project Module (Core Container)
- **Description**: Project customization, Member roles, Features toggle (Cycles, Modules, Views, Pages, Intake). Customization for states, labels, and estimates.
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/project/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/`

### Issues Module (Tasks/Tickets)
- **Description**: Core CRUD, Priority, State, Dates, Estimate. Rich Text syncing. Relationships (parent-child, relates to, blocks). Collaboration (comments, reactions).
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/issue/`, `apps/api/plane/app/views/state/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/`

### Cycles Module (Sprints)
- **Description**: Time-boxed periods for grouping issues. Start and End dates, burndown analytics.
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/cycle/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/`

### Modules Module (Features / Epics)
- **Description**: Structuring work items by overarching feature/component. Grouping issues independent of time.
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/module/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/`

### Pages Module (Documentation)
- **Description**: Knowledge base and project documentation integrated deeply with the workspace/project context.
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/page/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/`

### Intake Module (Inbox)
- **Description**: Inbox for un-triaged or newly created issues before they are formally brought into the project workflow.
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/intake/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/`

### Views Module (Filters)
- **Description**: Saved combinations of filters, grouping, and ordering for issue tables and boards.
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/view/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/`

### Analytics Module
- **Description**: Workspace-level data insights and telemetry.
- **Key Folders**:
  - Backend: `apps/api/plane/app/views/analytic/`
  - Frontend: `apps/web/app/(all)/[workspaceSlug]/analytics/`
