# File Tree: Insightimate

**Generated:** 10/20/2025, 3:01:54 AM
**Root Path:** `/home/nguyenhuuhung/projects/Insightimate`

```
├── 📁 docs
├── 📁 public
│   ├── 📁 icons
│   │   ├── 📁 issue-type
│   │   │   ├── 🖼️ bug.svg
│   │   │   ├── 🖼️ epic.svg
│   │   │   ├── 🖼️ story.svg
│   │   │   ├── 🖼️ sub-task.svg
│   │   │   └── 🖼️ task.svg
│   │   ├── 📁 priority
│   │   │   ├── 🖼️ high.svg
│   │   │   ├── 🖼️ highest.svg
│   │   │   ├── 🖼️ low.svg
│   │   │   ├── 🖼️ lowest.svg
│   │   │   └── 🖼️ medium.svg
│   │   └── 📁 project
│   │       ├── 🖼️ 1000.svg
│   │       ├── 🖼️ 1001.svg
│   │       ├── 🖼️ 1002.svg
│   │       ├── 🖼️ 1003.svg
│   │       ├── 🖼️ 1004.svg
│   │       ├── 🖼️ 1005.svg
│   │       ├── 🖼️ 1006.svg
│   │       ├── 🖼️ 1007.svg
│   │       ├── 🖼️ 1008.svg
│   │       ├── 🖼️ 1009.svg
│   │       └── 🖼️ 1010.svg
│   ├── 🖼️ file.svg
│   ├── 🖼️ globe.svg
│   ├── 🖼️ next.svg
│   ├── 🖼️ vercel.svg
│   └── 🖼️ window.svg
├── 📁 scripts
│   ├── 📁 cerbos
│   │   ├── 📁 config
│   │   │   └── ⚙️ cerbos.yaml
│   │   ├── 📁 policies
│   │   │   ├── ⚙️ common.yaml
│   │   │   ├── ⚙️ resource.project.yaml
│   │   │   ├── ⚙️ resource.workspace.yaml
│   │   │   └── ⚙️ resource.ws_member.yaml
│   │   └── 📁 schemas
│   ├── 📁 openfga
│   │   ├── ⚙️ rbac-authorization-model.json
│   │   └── 📄 schema_v1.openfga
│   └── ⚙️ docker-compose.yml
├── 📁 src
│   ├── 📁 app
│   │   ├── 📁 (auth)
│   │   │   ├── 📁 signin
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 signup
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 layout.tsx
│   │   ├── 📁 (authed)
│   │   │   ├── 📁 accept-invite
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 wps
│   │   │   │   ├── 📁 [workspaceId]
│   │   │   │   │   ├── 📁 foryou
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 plans
│   │   │   │   │   │   ├── 📁 [planId]
│   │   │   │   │   │   │   ├── 📁 [scenarioId]
│   │   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   │   ├── 📁 comps
│   │   │   │   │   │   │   │   └── 📄 plan-header.tsx
│   │   │   │   │   │   │   ├── 📁 settings
│   │   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   │   ├── 📄 layout.tsx
│   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   ├── 📁 create
│   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 projects
│   │   │   │   │   │   ├── 📁 [projectId]
│   │   │   │   │   │   │   ├── 📁 _tabs
│   │   │   │   │   │   │   │   ├── 📄 backlog-tab.tsx
│   │   │   │   │   │   │   │   ├── 📄 index.ts
│   │   │   │   │   │   │   │   ├── 📄 kanban-tab.tsx
│   │   │   │   │   │   │   │   └── 📄 list-tab.tsx
│   │   │   │   │   │   │   ├── 📁 issues
│   │   │   │   │   │   │   │   └── 📁 [issueId]
│   │   │   │   │   │   │   │       └── 📄 page.tsx
│   │   │   │   │   │   │   ├── 📁 members
│   │   │   │   │   │   │   │   ├── 📄 page-container.tsx
│   │   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   │   ├── 📄 layout.tsx
│   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   ├── 📁 create
│   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 settings
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 teams
│   │   │   │   │   │   ├── 📁 [teamId]
│   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📄 error.tsx
│   │   │   │   │   ├── 📄 layout.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📄 error.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 api
│   │   │   ├── 📁 v1
│   │   │   │   ├── 📁 auth
│   │   │   │   │   ├── 📁 signin
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 signout
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📁 signup
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📁 boards
│   │   │   │   │   └── 📁 [boardId]
│   │   │   │   │       ├── 📁 backlog
│   │   │   │   │       │   └── 📁 epics
│   │   │   │   │       │       └── 📄 route.ts
│   │   │   │   │       ├── 📁 issues
│   │   │   │   │       │   ├── 📁 [issueId]
│   │   │   │   │       │   │   └── 📄 route.ts
│   │   │   │   │       │   └── 📄 route.ts
│   │   │   │   │       ├── 📁 reorder
│   │   │   │   │       │   └── 📄 route.ts
│   │   │   │   │       ├── 📁 sprints
│   │   │   │   │       │   ├── 📁 [sprintId]
│   │   │   │   │       │   │   └── 📄 route.ts
│   │   │   │   │       │   ├── 📁 issues
│   │   │   │   │       │   │   └── 📄 route.ts
│   │   │   │   │       │   └── 📄 route.ts
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📁 members
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 permissions
│   │   │   │   │   └── 📁 [userId]
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📁 projects
│   │   │   │   │   ├── 📁 [projectId]
│   │   │   │   │   │   ├── 📁 issue-priorities
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 issue-statuses
│   │   │   │   │   │   │   ├── 📁 [statusId]
│   │   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 issue-types
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 issues
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 members
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 teams
│   │   │   │   │   ├── 📁 [teamId]
│   │   │   │   │   │   ├── 📁 memberships
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 users
│   │   │   │   │   ├── 📁 [userId]
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 me
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📁 public
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   └── 📁 workspaces
│   │   │   │       ├── 📁 [workspaceId]
│   │   │   │       │   ├── 📁 members
│   │   │   │       │   │   ├── 📁 [memberId]
│   │   │   │       │   │   │   └── 📄 route.ts
│   │   │   │       │   │   ├── 📁 invite
│   │   │   │       │   │   │   └── 📄 route.ts
│   │   │   │       │   │   └── 📄 route.ts
│   │   │   │       │   ├── 📁 projects
│   │   │   │       │   │   ├── 📁 [projectId]
│   │   │   │       │   │   │   ├── 📁 issue-priorities
│   │   │   │       │   │   │   │   └── 📄 route.ts
│   │   │   │       │   │   │   ├── 📁 issue-statuses
│   │   │   │       │   │   │   │   ├── 📁 [statusId]
│   │   │   │       │   │   │   │   └── 📄 route.ts
│   │   │   │       │   │   │   ├── 📁 issue-types
│   │   │   │       │   │   │   │   └── 📄 route.ts
│   │   │   │       │   │   │   ├── 📁 issues
│   │   │   │       │   │   │   │   └── 📄 route.ts
│   │   │   │       │   │   │   ├── 📁 members
│   │   │   │       │   │   │   │   └── 📄 route.ts
│   │   │   │       │   │   │   └── 📄 route.ts
│   │   │   │       │   │   ├── 📁 facets
│   │   │   │       │   │   │   └── 📄 route.ts
│   │   │   │       │   │   └── 📄 route.ts
│   │   │   │       │   └── 📄 route.ts
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 v2
│   │   │   │   ├── 📁 auth
│   │   │   │   │   ├── 📁 me
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 signin
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 signout
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📁 signup
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📁 authz
│   │   │   │   │   ├── 📁 invitations
│   │   │   │   │   │   ├── 📁 [inviteId]
│   │   │   │   │   │   │   ├── 📁 resend
│   │   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   │   └── 📁 revoke
│   │   │   │   │   │   │       └── 📄 route.ts
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 invite
│   │   │   │   │   │   ├── 📁 candidates
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 boards
│   │   │   │   │   └── 📁 [boardId]
│   │   │   │   │       ├── 📁 columns
│   │   │   │   │       │   └── 📄 route.ts
│   │   │   │   │       ├── 📁 issues
│   │   │   │   │       │   ├── 📁 [issueId]
│   │   │   │   │       │   │   ├── 📁 move
│   │   │   │   │       │   │   │   └── 📄 route.ts
│   │   │   │   │       │   │   └── 📄 route.ts
│   │   │   │   │       │   └── 📄 route.ts
│   │   │   │   │       ├── 📁 issues:facets
│   │   │   │   │       │   └── 📄 route.ts
│   │   │   │   │       ├── 📁 issues:metrics
│   │   │   │   │       │   └── 📄 route.ts
│   │   │   │   │       ├── 📁 sprints
│   │   │   │   │       │   ├── 📁 [sprintId]
│   │   │   │   │       │   │   ├── 📁 complete
│   │   │   │   │       │   │   │   └── 📄 route.ts
│   │   │   │   │       │   │   ├── 📁 start
│   │   │   │   │       │   │   │   └── 📄 route.ts
│   │   │   │   │       │   │   └── 📄 route.ts
│   │   │   │   │       │   └── 📄 route.ts
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📁 projects
│   │   │   │   │   ├── 📁 [projectId]
│   │   │   │   │   │   ├── 📁 actors
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 fields
│   │   │   │   │   │   │   └── 📁 statuses
│   │   │   │   │   │   │       └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 members
│   │   │   │   │   │   │   ├── 📁 [memberId]
│   │   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 permissions
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 roles
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 roles:write
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 facets
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 teams
│   │   │   │   │   ├── 📁 [teamId]
│   │   │   │   │   │   ├── 📁 links
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   ├── 📁 members
│   │   │   │   │   │   │   ├── 📁 [memberId]
│   │   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 workspaces
│   │   │   │       ├── 📁 [workspaceId]
│   │   │   │       │   ├── 📁 members
│   │   │   │       │   │   ├── 📁 [memberId]
│   │   │   │       │   │   │   ├── 📁 assign_role
│   │   │   │       │   │   │   │   └── 📄 route.ts
│   │   │   │       │   │   │   ├── 📁 leave
│   │   │   │       │   │   │   │   └── 📄 route.ts
│   │   │   │       │   │   │   └── 📄 route.ts
│   │   │   │       │   │   └── 📄 route.ts
│   │   │   │       │   └── 📄 route.ts
│   │   │   │       └── 📄 route.ts
│   │   │   └── 📄 route.ts
│   │   ├── 📄 error.tsx
│   │   ├── 📄 favicon.ico
│   │   ├── 🎨 globals.css
│   │   └── 📄 layout.tsx
│   ├── 📁 components
│   │   ├── 📁 errors
│   │   │   ├── 📄 error.tsx
│   │   │   ├── 📄 forbidden.tsx
│   │   │   ├── 📄 global-error.tsx
│   │   │   ├── 📄 not-found.tsx
│   │   │   └── 📄 unauthorized.tsx
│   │   ├── 📁 headers
│   │   │   ├── 📄 project-header.tsx
│   │   │   └── 📄 team-header.tsx
│   │   ├── 📁 table
│   │   │   ├── 📄 data-table-faceted-filter.tsx
│   │   │   ├── 📄 data-table-header.tsx
│   │   │   ├── 📄 data-table-pagination.tsx
│   │   │   ├── 📄 data-table-toolbar.tsx
│   │   │   ├── 📄 data-table-view-options.tsx
│   │   │   ├── 📄 data-table.tsx
│   │   │   ├── 📄 data-toolbar.tsx
│   │   │   └── 📄 index.ts
│   │   ├── 📁 ui
│   │   │   ├── 📄 accordion.tsx
│   │   │   ├── 📄 alert-dialog.tsx
│   │   │   ├── 📄 alert.tsx
│   │   │   ├── 📄 aspect-ratio.tsx
│   │   │   ├── 📄 avatar.tsx
│   │   │   ├── 📄 badge.tsx
│   │   │   ├── 📄 breadcrumb.tsx
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 calendar.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 carousel.tsx
│   │   │   ├── 📄 chart.tsx
│   │   │   ├── 📄 checkbox.tsx
│   │   │   ├── 📄 collapsible.tsx
│   │   │   ├── 📄 command.tsx
│   │   │   ├── 📄 context-menu.tsx
│   │   │   ├── 📄 dialog.tsx
│   │   │   ├── 📄 drawer.tsx
│   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   ├── 📄 form.tsx
│   │   │   ├── 📄 hover-card.tsx
│   │   │   ├── 📄 input-otp.tsx
│   │   │   ├── 📄 input.tsx
│   │   │   ├── 📄 label.tsx
│   │   │   ├── 📄 menubar.tsx
│   │   │   ├── 📄 navigation-menu.tsx
│   │   │   ├── 📄 pagination.tsx
│   │   │   ├── 📄 popover.tsx
│   │   │   ├── 📄 progress.tsx
│   │   │   ├── 📄 radio-group.tsx
│   │   │   ├── 📄 resizable.tsx
│   │   │   ├── 📄 scroll-area.tsx
│   │   │   ├── 📄 select.tsx
│   │   │   ├── 📄 separator.tsx
│   │   │   ├── 📄 sheet.tsx
│   │   │   ├── 📄 sidebar.tsx
│   │   │   ├── 📄 skeleton.tsx
│   │   │   ├── 📄 slider.tsx
│   │   │   ├── 📄 sonner.tsx
│   │   │   ├── 📄 switch.tsx
│   │   │   ├── 📄 table.tsx
│   │   │   ├── 📄 tabs.tsx
│   │   │   ├── 📄 textarea.tsx
│   │   │   ├── 📄 toggle-group.tsx
│   │   │   ├── 📄 toggle.tsx
│   │   │   └── 📄 tooltip.tsx
│   │   ├── 📄 action-menu.tsx
│   │   ├── 📄 date-picker.tsx
│   │   ├── 📄 dotted-separator.tsx
│   │   ├── 📄 editable-storypoints.tsx
│   │   └── 📄 editable-text.tsx
│   ├── 📁 contracts
│   │   ├── 📁 auth
│   │   │   ├── 📄 auth.input.ts
│   │   │   ├── 📄 auth.ts
│   │   │   ├── 📄 authz.ts
│   │   │   └── 📄 index.ts
│   │   ├── 📁 boards
│   │   │   ├── 📄 board.ts
│   │   │   ├── 📄 boards.input.ts
│   │   │   └── 📄 boards.query.ts
│   │   ├── 📁 issues
│   │   │   ├── 📄 issue.ts
│   │   │   ├── 📄 issues.input.ts
│   │   │   └── 📄 issues.query.ts
│   │   ├── 📁 plans
│   │   │   ├── 📄 plan.ts
│   │   │   └── 📄 plans.input.ts
│   │   ├── 📁 projects
│   │   │   ├── 📄 index.ts
│   │   │   ├── 📄 project.ts
│   │   │   ├── 📄 projects.input.ts
│   │   │   └── 📄 projects.query.ts
│   │   ├── 📁 users
│   │   │   ├── 📄 index.ts
│   │   │   ├── 📄 user.ts
│   │   │   └── 📄 users.input.ts
│   │   ├── 📁 workspaces
│   │   │   ├── 📄 index.ts
│   │   │   ├── 📄 workspace.ts
│   │   │   ├── 📄 workspaces.input.ts
│   │   │   └── 📄 workspaces.query.ts
│   │   ├── 📄 common.ts
│   │   └── 📄 teams.ts
│   ├── 📁 features
│   │   ├── 📁 _template_
│   │   │   ├── 📁 server
│   │   │   │   ├── 📄 repo.ts
│   │   │   │   └── 📄 service.ts
│   │   │   ├── 📁 stores
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 types
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 ui
│   │   │   │   ├── 📁 components
│   │   │   │   │   └── 📄 index.ts
│   │   │   │   └── 📁 forms
│   │   │   │       ├── 📄 TemplateForm.tsx
│   │   │   │       └── 📄 index.ts
│   │   │   ├── 📁 utils
│   │   │   │   └── 📄 index.ts
│   │   │   └── 📄 index.ts
│   │   ├── 📁 authn
│   │   │   ├── 📁 api
│   │   │   │   ├── 📄 actions.ts
│   │   │   │   └── 📄 http.ts
│   │   │   ├── 📁 server
│   │   │   │   ├── 📄 password.ts
│   │   │   │   └── 📄 service.ts
│   │   │   └── 📁 ui
│   │   │       └── 📁 forms
│   │   │           ├── 📄 index.ts
│   │   │           ├── 📄 signin-form.tsx
│   │   │           └── 📄 signup-form.tsx
│   │   ├── 📁 authz
│   │   │   ├── 📁 api
│   │   │   │   ├── 📄 actions.ts
│   │   │   │   ├── 📄 http.ts
│   │   │   │   └── 📄 tuple-factory.ts
│   │   │   └── 📁 server
│   │   │       ├── 📁 authz
│   │   │       │   ├── 📄 rebuild-openfga.ts
│   │   │       │   └── 📄 tuple-factory.ts
│   │   │       ├── 📄 authz.service.ts
│   │   │       ├── 📄 index.ts
│   │   │       ├── 📄 invite-token.ts
│   │   │       ├── 📄 invite.service.ts
│   │   │       ├── 📄 pip.ts
│   │   │       └── 📄 servcie.ts
│   │   ├── 📁 boards
│   │   │   ├── 📁 api
│   │   │   │   ├── 📄 actions.ts
│   │   │   │   └── 📄 http.ts
│   │   │   ├── 📁 hooks
│   │   │   │   └── 📄 index.tsx
│   │   │   ├── 📁 server
│   │   │   │   ├── 📁 cqrs
│   │   │   │   │   ├── 📄 board-issue-move.ts
│   │   │   │   │   ├── 📄 board-issue-rank.ts
│   │   │   │   │   ├── 📄 board-sprint.ts
│   │   │   │   │   ├── 📄 id-generators.ts
│   │   │   │   │   ├── 📄 index.ts
│   │   │   │   │   └── 📄 issue-metric.ts
│   │   │   │   └── 📄 service.ts
│   │   │   └── 📁 ui
│   │   │       ├── 📁 buttons
│   │   │       │   ├── 📄 complete-sprint-btn.tsx
│   │   │       │   ├── 📄 create-issue-btn.tsx
│   │   │       │   └── 📄 update-sprint-btn.tsx
│   │   │       ├── 📁 components
│   │   │       │   ├── 📄 CommentInput.tsx
│   │   │       │   ├── 📄 CommentList.tsx
│   │   │       │   ├── 📄 ReplyModal.tsx
│   │   │       │   ├── 📄 board-issue-actionts.tsx
│   │   │       │   ├── 📄 data-kanban.tsx
│   │   │       │   ├── 📄 date-picker-input.tsx
│   │   │       │   ├── 📄 index.ts
│   │   │       │   ├── 📄 kanban-board.tsx
│   │   │       │   ├── 📄 kanban-column-header.tsx
│   │   │       │   ├── 📄 more-options-dropdown.tsx
│   │   │       │   ├── 📄 richtext-description.tsx
│   │   │       │   ├── 📄 row-backlog.tsx
│   │   │       │   ├── 📄 row-sprint.tsx
│   │   │       │   ├── 📄 scrum-board.tsx
│   │   │       │   ├── 📄 scrum-item-issue.tsx
│   │   │       │   ├── 📄 sprint-actions.tsx
│   │   │       │   └── 📄 status-dropdown.tsx
│   │   │       ├── 📁 forms
│   │   │       │   ├── 📄 complete-sprint-form.tsx
│   │   │       │   ├── 📄 create-issue-form.tsx
│   │   │       │   └── 📄 update-sprint-form.tsx
│   │   │       ├── 📁 selectors
│   │   │       │   ├── 📄 duration-preset-selectors.tsx
│   │   │       │   ├── 📄 index.ts
│   │   │       │   ├── 📄 issue-date-selectors.tsx
│   │   │       │   └── 📄 issue-field-selectors.tsx
│   │   │       └── 📁 tables
│   │   │           ├── 📁 cells
│   │   │           │   ├── 📄 issue-assignee-cell.tsx
│   │   │           │   ├── 📄 issue-date-cell.tsx
│   │   │           │   ├── 📄 issue-priority-cell.tsx
│   │   │           │   ├── 📄 issue-status-cell.tsx
│   │   │           │   └── 📄 issue-type-cell.tsx
│   │   │           └── 📄 issue-column.tsx
│   │   ├── 📁 projects
│   │   │   ├── 📁 api
│   │   │   │   ├── 📄 actions.ts
│   │   │   │   └── 📄 http.ts
│   │   │   ├── 📁 hooks
│   │   │   │   └── 📄 use-role-management.tsx
│   │   │   ├── 📁 server
│   │   │   │   ├── 📁 cqrs
│   │   │   │   │   ├── 📄 c-project-create.ts
│   │   │   │   │   ├── 📄 c-project-delete.ts
│   │   │   │   │   ├── 📄 c-project-roles-write.ts
│   │   │   │   │   ├── 📄 c-project-update.ts
│   │   │   │   │   ├── 📄 data-builders.ts
│   │   │   │   │   ├── 📄 id-generators.ts
│   │   │   │   │   ├── 📄 index.ts
│   │   │   │   │   ├── 📄 project-actor.service.ts
│   │   │   │   │   ├── 📄 project-field.service.ts
│   │   │   │   │   ├── 📄 project.service.ts
│   │   │   │   │   ├── 📄 q-project-get.ts
│   │   │   │   │   ├── 📄 q-project-list.ts
│   │   │   │   │   ├── 📄 template.ts
│   │   │   │   │   ├── 📄 types.ts
│   │   │   │   │   └── 📄 validation.ts
│   │   │   │   ├── 📄 project-roles.service.ts
│   │   │   │   └── 📄 projects.service.ts
│   │   │   └── 📁 ui
│   │   │       ├── 📁 buttons
│   │   │       │   ├── 📄 add-role-button.tsx
│   │   │       │   ├── 📄 add-team-dialog-button.tsx
│   │   │       │   ├── 📄 add-user-dialog-button.tsx
│   │   │       │   └── 📄 remove-role-button.tsx
│   │   │       ├── 📁 components
│   │   │       │   ├── 📄 general-settings.tsx
│   │   │       │   ├── 📄 member-row.tsx
│   │   │       │   ├── 📄 member-settings.tsx
│   │   │       │   ├── 📄 permission-settings.tsx
│   │   │       │   ├── 📄 project-actions.tsx
│   │   │       │   ├── 📄 project-settings-sheet.tsx
│   │   │       │   ├── 📄 status-settings.tsx
│   │   │       │   └── 📄 worktype-settings.tsx
│   │   │       ├── 📁 forms
│   │   │       │   ├── 📄 change-icon-form.tsx
│   │   │       │   ├── 📄 index.ts
│   │   │       │   ├── 📄 project-create-form.tsx
│   │   │       │   ├── 📄 project-icon-selecte.tsx
│   │   │       │   ├── 📄 project-info.tsx
│   │   │       │   ├── 📄 project-permission.tsx
│   │   │       │   └── 📄 update-project-form.tsx
│   │   │       └── 📁 table
│   │   │           ├── 📄 project-actions.tsx
│   │   │           ├── 📄 project-column.tsx
│   │   │           └── 📄 project-tool-bar.tsx
│   │   ├── 📁 teams
│   │   │   ├── 📁 api
│   │   │   │   ├── 📄 actionts.ts
│   │   │   │   └── 📄 http.ts
│   │   │   ├── 📁 server
│   │   │   │   └── 📄 teams.service.ts
│   │   │   └── 📁 ui
│   │   │       ├── 📁 buttons
│   │   │       │   └── 📄 create-team-btn.tsx
│   │   │       ├── 📁 components
│   │   │       │   ├── 📄 team-actions.tsx
│   │   │       │   ├── 📄 team-info.tsx
│   │   │       │   ├── 📄 team-links.tsx
│   │   │       │   ├── 📄 team-member-actionts.tsx
│   │   │       │   ├── 📄 team-share.tsx
│   │   │       │   ├── 📄 teams-header.tsx
│   │   │       │   └── 📄 teams-list.tsx
│   │   │       ├── 📁 dialogs
│   │   │       │   └── 📄 create-team-dialog.tsx
│   │   │       ├── 📁 forms
│   │   │       │   └── 📄 create-team-form.tsx
│   │   │       └── 📁 selectors
│   │   │           └── 📄 teams-selector.tsx
│   │   ├── 📁 users
│   │   │   ├── 📁 api
│   │   │   │   ├── 📄 actions.ts
│   │   │   │   └── 📄 http.ts
│   │   │   └── 📁 ui
│   │   │       ├── 📄 user-invite.tsx
│   │   │       ├── 📄 user-select.tsx
│   │   │       └── 📄 user-selector.tsx
│   │   └── 📁 workspaces
│   │       ├── 📁 api
│   │       │   ├── 📄 actions.ts
│   │       │   └── 📄 http.ts
│   │       ├── 📁 server
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 member.service.ts
│   │       │   ├── 📄 service.ts
│   │       │   └── 📄 workspace.service.ts
│   │       ├── 📁 ui
│   │       │   ├── 📁 buttons
│   │       │   │   ├── 📄 delete-workspace-btn.tsx
│   │       │   │   └── 📄 leave-workspace-btn.tsx
│   │       │   ├── 📁 components
│   │       │   │   ├── 📄 invitation-actions.tsx
│   │       │   │   ├── 📄 invitations-list.tsx
│   │       │   │   ├── 📄 member-actionts.tsx
│   │       │   │   ├── 📄 members-list.tsx
│   │       │   │   ├── 📄 workspace-header.tsx
│   │       │   │   └── 📄 workspace-info.tsx
│   │       │   ├── 📁 forms
│   │       │   │   ├── 📄 create-workspace-form.tsx
│   │       │   │   ├── 📄 delete-workspace-form.tsx
│   │       │   │   ├── 📄 index.ts
│   │       │   │   └── 📄 leave-workspace-form.tsx
│   │       │   └── 📁 selectors
│   │       │       ├── 📄 index.ts
│   │       │       └── 📄 workspace-selector.tsx
│   │       └── 📁 utils
│   │           └── 📄 index.ts
│   ├── 📁 hooks
│   │   ├── 📁 atoms
│   │   │   └── 📄 workspace.atom.ts
│   │   ├── 📁 stores
│   │   │   ├── 📄 auth-store.ts
│   │   │   ├── 📄 index.ts
│   │   │   ├── 📄 project-store.ts
│   │   │   └── 📄 use-gantt-jotai.ts
│   │   ├── 📄 use-controlled-state.ts
│   │   ├── 📄 use-mobile.ts
│   │   ├── 📄 use-project-params.ts
│   │   └── 📄 use-projects-params.ts
│   ├── 📁 layouts
│   │   ├── 📄 app-sidebar.tsx
│   │   ├── 📄 layout-app.tsx
│   │   ├── 📄 layout-project.tsx
│   │   ├── 📄 layout-wps.tsx
│   │   ├── 📄 nav-main.tsx
│   │   ├── 📄 nav-projects.tsx
│   │   ├── 📄 nav-user.tsx
│   │   └── 📄 workspace-switcher.tsx
│   ├── 📁 lib
│   │   ├── 📁 api
│   │   │   ├── 📄 _buildapi.ts
│   │   │   ├── 📄 _client.ts
│   │   │   └── 📄 index.ts
│   │   ├── 📁 auth
│   │   │   ├── 📄 guards.ts
│   │   │   ├── 📄 helpers.ts
│   │   │   ├── 📄 index.ts
│   │   │   └── 📄 session.ts
│   │   ├── 📁 authz
│   │   │   ├── 📁 cerbos
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 openfga
│   │   │   └── 📄 policy-engine.ts
│   │   ├── 📁 http
│   │   │   ├── 📁 errors
│   │   │   │   ├── 📄 _base.ts
│   │   │   │   ├── 📄 auth.error.ts
│   │   │   │   ├── 📄 index.ts
│   │   │   │   ├── 📄 invite.error.ts
│   │   │   │   ├── 📄 project.error.ts
│   │   │   │   └── 📄 workspace.error.ts
│   │   │   ├── 📁 filters
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📄 api-handler.ts
│   │   │   ├── 📄 problem.ts
│   │   │   ├── 📄 response.ts
│   │   │   └── 📄 validate.ts
│   │   ├── 📁 mail-sender
│   │   │   └── 📄 index.ts
│   │   ├── 📁 prisma
│   │   │   ├── 📁 schema
│   │   │   │   ├── 📄 activity_log.prisma
│   │   │   │   ├── 📄 auth.prisma
│   │   │   │   ├── 📄 board.prisma
│   │   │   │   ├── 📄 comments.prisma
│   │   │   │   ├── 📄 issue.prisma
│   │   │   │   ├── 📄 plan.prisma
│   │   │   │   ├── 📄 project.prisma
│   │   │   │   ├── 📄 schema.prisma
│   │   │   │   ├── 📄 team.prisma
│   │   │   │   └── 📄 workspace.prisma
│   │   │   └── 📄 index.ts
│   │   ├── 📁 utils
│   │   │   ├── 📄 api.ts
│   │   │   ├── 📄 cn.ts
│   │   │   ├── 📄 index.ts
│   │   │   ├── 📄 lexorank-num.ts
│   │   │   ├── 📄 materialized-path-str.ts
│   │   │   ├── 📄 materialized-path.ts
│   │   │   ├── 📄 mp-lexorank.ts
│   │   │   └── 📄 mp-rank.ts
│   │   └── 📁 validators
│   │       └── 📄 index.ts
│   ├── 📁 providers
│   │   ├── 📄 jotai-provider.tsx
│   │   └── 📄 react-query-client.tsx
│   └── 📄 middleware.ts
├── ⚙️ .gitignore
├── ⚙️ .prettierignore
├── ⚙️ .prettierrc
├── 📝 README.md
├── ⚙️ components.json
├── 📄 eslint.config.mjs
├── 📄 next.config.ts
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── ⚙️ pnpm-lock.yaml
├── ⚙️ pnpm-workspace.yaml
├── 📄 postcss.config.mjs
└── ⚙️ tsconfig.json
```

---
*Generated by FileTree Pro Extension*