# Terminology Mapping

This document maps the concepts and terminologies used in the Plane reference project to the Insightimate Main Project.

| Plane Term | Main Project Term | Notes |
|:---:|:---:|:---|
| Workspace | Organization (Org) | The root tenant. URLs use `[orgSlug]` instead of `[workspaceSlug]`. API uses `orgs`. |
| Project | Project (Proj) | The core container for issues. Uses `projs` in v3 API and some UI paths. |
| Issue | Issue | Same term. Represents tasks/tickets. |
| Cycle | Sprint | Time-boxed periods for grouping issues. API and UI paths use `sprints`. |
| Module | (Missing/N/A) | Grouping issues independent of time. Not yet implemented in Main Project. |
| Page | (Missing/N/A) | Project documentation. Not yet implemented in Main Project. |
| Intake | (Missing/N/A) | Triage inbox for issues. Not yet implemented. |
| State | ProjectState / Issue Status | Configurable columns/states in a kanban board (e.g. Backlog, Todo, In Progress). |
| View | BoardFilter | Saved filters. Main Project currently has `BoardFilter` but not a full Views engine. |
| User/Member | User/Member | Same terminology. |
| Activity / History | ActivityEvent | Extracted via Debezium in the Main Project. |
