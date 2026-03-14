# Prioritized Roadmap

Based on the gap analysis between the Main Project and the Plane reference project, here is the phased roadmap for achieving feature parity and stabilization.

### Phase 1 — Critical (blocking other features, Low-Medium complexity)
- **Complete v3 API Migration for Projects & Sprints**
  - Reference path in ./plane/: `apps/api/plane/app/views/project/` and `cycle/`
  - Estimated effort: S
  - Dependencies: None
- **Activity & History Feed Rendering**
  - Reference path in ./plane/: Issue Activity models and serializers
  - Estimated effort: M
  - Dependencies: v3/activity API stabilization

### Phase 2 — Core Features (Medium complexity)
- **Intake (Inbox)**
  - Reference path in ./plane/: `apps/api/plane/app/views/intake/`
  - Estimated effort: M
  - Dependencies: Issue Model stabilization
- **Advanced Views (Custom Filters & Grouping)**
  - Reference path in ./plane/: `apps/api/plane/app/views/view/`
  - Estimated effort: M
  - Dependencies: Issues, Boards

### Phase 3 — Advanced Features (High complexity)
- **Modules (Epics / Functional Grouping)**
  - Reference path in ./plane/: `apps/api/plane/app/views/module/`
  - Estimated effort: M
  - Dependencies: Issues
- **Pages (Project Documentation)**
  - Reference path in ./plane/: `apps/api/plane/app/views/page/`
  - Estimated effort: XL
  - Dependencies: Projects, Workspace context
- **Workspace-wide Analytics**
  - Reference path in ./plane/: `apps/api/plane/app/views/analytic/`
  - Estimated effort: L
  - Dependencies: Sprints, Issues completeness

### Phase 4 — Polish & Improvements
- **Real-time Collaboration Upgrades**
  - Enhance TipTap with live cursors, deeply nested comment threads, and rich reactions.
  - Estimated effort: L
  - Dependencies: Core features complete
- **Performance Optimizations**
  - Migrating more features to utilize optimistic UI updates and robust background sync (like Plane's implementation of activity logs).
  - Estimated effort: M
  - Dependencies: All core APIs stable
