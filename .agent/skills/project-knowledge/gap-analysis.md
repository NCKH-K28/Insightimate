# Gap Analysis — Main Project vs Plane Reference

> **Last scanned**: 2026-03-16  
> **Based on**: `main-features.md` and `plane-features.md`

---

## Summary

| Impact Level | Count |
|-------------|-------|
| **Critical** | 2 |
| **High** | 6 |
| **Medium** | 5 |
| **Low** | 4 |
| **Total** | 17 |

---

## Gap Table

| # | Feature | Main Project Status | Plane Reference | Gap Type | Gap Description | Impact |
|---|---------|-------------------|----------------|----------|----------------|--------|
| G1 | **Labels** | ❌ Not started | Full CRUD, workspace + project scope, hierarchical, color-coded | Missing entirely | No Label model, no endpoints, no UI. Issues cannot be categorized with labels. | **Critical** |
| G2 | **Modules** | ❌ Not started | Full CRUD, module-issue M2M, favorites, status tracking | Missing entirely | No Module model or endpoints. Cannot group issues by feature/initiative. | **High** |
| G3 | **Views (Saved Filters)** | ❌ Not started | Project + workspace views, shared, saved filters/sorts | Missing entirely | No View model. Users cannot save and share filtered issue lists. | **High** |
| G4 | **Intake / Inbox** | ❌ Not started | Triage workflow, accept/reject/snooze/duplicate | Missing entirely | No intake model or triage workflow for external issue submissions. | **Medium** |
| G5 | **Pages / Wiki** | ❌ Not started | Rich text pages, page tree, nested pages, favorites | Missing entirely | No documentation/wiki feature. | **Medium** |
| G6 | **Notifications** | ❌ Not started | In-app notifications, read/unread, mentions | Missing entirely | No notification system. Users aren't alerted to relevant changes. | **Critical** |
| G7 | **Webhooks** | ❌ Not started | Workspace-level webhook configuration, event-driven | Missing entirely | No webhook integration for external services. | **Low** |
| G8 | **Estimates** | 🔧 Partial | Custom estimate point scales (points/categories/time) | Partial | `storyPoints` field exists on Issue, but no estimate configuration model or UI for defining point scales. | **Medium** |
| G9 | **Multi-Assignee** | ❌ Not started | Multiple assignees per issue | Missing entirely | Main supports only single `assigneeId`. Plane supports multiple assignees via M2M. | **High** |
| G10 | **Issue Comments (v3)** | 🔧 Partial (v2 only) | Full comment system with activity integration | Outdated | Comments exist only via v2 collab route (`/api/v2/collab/threads/`). Not migrated to v3. | **High** |
| G11 | **Board Column Management** | 🔧 Partial | Plane handles states-as-columns implicitly | Partial | Create and reorder column endpoints return stubs/dummy data. | **Medium** |
| G12 | **Search (v3)** | 🔧 Partial (v2 + partial v3) | Global search across entities | Outdated | Main has v2 search route + v3 project search only. No unified search across all entity types. | **High** |
| G13 | **Analytics Dashboard** | 🔧 Partial | Custom analytics with configurable grouping | Partial | Sprint analytics exist. No org/workspace-level analytics dashboard. | **Medium** |
| G14 | **AI Agents (v3 migration)** | ✅ Complete (v2) | *(no equivalent in Plane)* | Outdated | All agent routes are v2. Need v3 migration eventually. Diverged feature (no Plane equivalent). | **Low** |
| G15 | **Starred Issues (v3)** | 🔧 Partial (v2) | Plane has generic UserFavorite | Outdated | Star/favorite feature only on v2 routes. Need v3 migration. | **Low** |
| G16 | **Stickies / Quick Notes** | ❌ Not started | Personal sticky notes | Missing entirely | No quick notes feature. | **Low** |
| G17 | **Broken Me Endpoints** | ❌ Broken | Working user profile + invite endpoints | Broken | 4 endpoints in `/api/v3/me/` use undefined functions/variables. Must fix. | **High** |

---

## Gap Categories

### Missing Entirely (7)
- G1: Labels
- G2: Modules
- G3: Views
- G4: Intake / Inbox
- G5: Pages / Wiki
- G6: Notifications
- G9: Multi-Assignee
- G16: Stickies

### Partial (4)
- G8: Estimates (field exists, no config model)
- G11: Board Column Management (stubs)
- G13: Analytics Dashboard (sprint-only)

### Outdated / Needs Migration (4)
- G10: Comments (v2 only)
- G12: Search (v2 + partial v3)
- G14: AI Agents (v2 only)
- G15: Starred Issues (v2 only)

### Broken (1)
- G17: Me route broken endpoints

### Diverged (Intentional)
- AI Agent system: Main has full AI/LLM integration not present in Plane. This is intentional and a differentiating feature.
- Board entity: Main uses explicit Board model (1:1 Project). Plane handles boards as display config. This is a deliberate architectural choice.
- Team entity: Main has cross-project teams. Plane has no team concept. This is an intentional addition.
- Plan/Scenario: Main-only planning feature. Intentionally different from Plane.
