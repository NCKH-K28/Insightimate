# Phase 1 — Implementation Plan

This document outlines the proposed architecture, schema changes, and endpoint designs for Phase 1 components. **No code has been written yet. Please review and approve this plan.**

---

## 1.1 Fix Broken Me Endpoints

### Gap Analysis
Several endpoints under `/api/v3/me/` reference `getAuthFromRequestHono`, which is deprecated/undefined. Furthermore, the variable `auth` is used but never properly retrieved. The correct pattern in v3 Hono route handlers is to use `getUserAndThrow(c)`, which returns a full `User` object (with `.id`, `.email`, etc.).

### Proposed Changes

#### File: `src/app/api/v3/me/[[...route]]/route.ts`

**1. `GET /orgs/invitees/:orgId`** (Lines 67-76)
- **Before:**
  ```typescript
  // const auth = await getAuthFromRequestHono(c);
  // ...
  // if (payload.email !== auth.email) {
  ```
- **After:**
  ```typescript
  const user = await getUserAndThrow(c);
  // ...
  if (payload.email !== user.email) {
  ```
*(Note: Remove the `throw new Error('Not implemented');` and uncomment the handler if this endpoint is meant to be active, or keep it commented out but fix the references for future use).*

**2. `POST /orgs/invitees/reject`** (Lines 89-99)
- **Before:**
  ```typescript
  const user = await getUserAndThrow(c);
  // ...
  const data = await orgInvitationService.reject({ token }, { actorId: auth.id });
  ```
- **After:**
  ```typescript
  const user = await getUserAndThrow(c);
  // ...
  const data = await orgInvitationService.reject({ token }, { actorId: user.id });
  ```

**3. `POST /orgs/:orgId/invite/accept`** (Lines 137-160)
- **Before:**
  ```typescript
  const auth = await getAuthFromRequestHono(c);
  // ...
  const result = await orgInvitationService.accept({ token }, { actorId: auth.userId });
  ```
- **After:**
  ```typescript
  const user = await getUserAndThrow(c);
  // ...
  const result = await orgInvitationService.accept({ token }, { actorId: user.id });
  ```

**4. `POST /orgs/:orgId/invite/reject`** (Lines 162-186)
- **Before:**
  ```typescript
  const auth = await getAuthFromRequestHono(c);
  // ...
  await orgInvitationService.reject({ token }, { actorId: auth.userId });
  ```
- **After:**
  ```typescript
  const user = await getUserAndThrow(c);
  // ...
  await orgInvitationService.reject({ token }, { actorId: user.id });
  ```

---

## 1.2 Notifications System

### Gap Analysis
Currently, there is no `Notification` model in `prisma/schema.prisma` or `src/lib/prisma/schema/*.prisma`. There are also no notification controllers or services in `src/features/` or `v3`.

By looking at Plane, notifications handle rich events (snooze, read state, archive) and connect directly to a receiver (User) and the triggered entity (Issue, Project, etc.). We will adapt this for Insightimate.

### 1. Prisma Schema (`src/lib/prisma/schema/notification.prisma`)

```prisma
model Notification {
  id               String    @id @default(cuid())
  organizationId   String    @map("organization_id")
  projectId        String?   @map("project_id")
  issueId          String?   @map("issue_id") // Entity identifier mapped natively
  type             String    // e.g., "IssueAssigned", "CommentMention", "StatusChanged"
  title            String    @db.Text
  message          String?   @db.Text
  data             Json?     // Used for flexible payload rendering
  actorId          String?   @map("actor_id") // Who triggered the notification
  receiverId       String    @map("receiver_id") // Who receives the notification
  readAt           DateTime? @map("read_at")
  snoozedUntil     DateTime? @map("snoozed_until")
  archivedAt       DateTime? @map("archived_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  project          Project?     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issue            Issue?       @relation(fields: [issueId], references: [id], onDelete: Cascade)
  actor            User?        @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)
  receiver         User         @relation("NotificationReceiver", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([receiverId, readAt])
  @@index([receiverId, snoozedUntil, archivedAt])
  @@map("notifications")
}

model NotificationPreference {
  id               String   @id @default(cuid())
  userId           String   @unique @map("user_id")
  emailMentions    Boolean  @default(true)  @map("email_mentions")
  emailAssignments Boolean  @default(true)  @map("email_assignments")
  emailUpdates     Boolean  @default(false) @map("email_updates")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}
```
*(References to models like `User`, `Organization`, `Project`, `Issue` will be configured appropriately in the multi-file schema).*

### 2. API Endpoints
All routes under `src/app/api/v3/orgs/[[...route]]/route.ts` (or separated to `notifications/route.ts` if preferred) mapping to `notifications.service.ts`:

- `GET /api/v3/orgs/:orgId/notifications`: List user notifications in org (Supports filters: `read`, `archived`, `snoozed`).
- `GET /api/v3/orgs/:orgId/notifications/unread-count`: Fetch total unread / mentions count.
- `PATCH /api/v3/orgs/:orgId/notifications/:id`: Update `snoozedUntil`.
- `POST /api/v3/orgs/:orgId/notifications/:id/read`: Mark single notification read.
- `DELETE /api/v3/orgs/:orgId/notifications/:id/read`: Mark unread.
- `POST /api/v3/orgs/:orgId/notifications/:id/archive`: Archive single notification.
- `POST /api/v3/orgs/:orgId/notifications/mark-all-read`: Mark all (matching optional filters) bound to user as read.

- `GET /api/v3/me/notification-preferences`: Get preferences.
- `PATCH /api/v3/me/notification-preferences`: Update flags.

### 3. Service Layer (`src/features/notifications/server/notifications.service.ts`)
Creates notifications securely using Cerbos/OpenFGA for read scopes. Triggers `Socket.IO` broadcasts to specific `user_room` when created.

### 4. Real-time & Email Delivery
- **Socket.io**: Broadcast `notification:new` to room `user:${receiverId}`. Payload maps to public Zod schema.
- **NodeMailer Integration**: Setup an async listener/queue (or defer in route) for notification creation. Checks sender preference. If `emailAssignments == true` and type is `IssueAssigned`, send email using templates.

---

## 1.3 Labels System

### Gap Analysis
Currently, there is no `Label` model attached to Issues or Projects in the Prisma schema. Plane supports project-scoped coloring and assignment to issues.

### 1. Prisma Schema (`src/lib/prisma/schema/label.prisma` or `issue.prisma`)

```prisma
model Label {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  name        String
  color       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project     Project  @relation("ProjectLabels", fields: [projectId], references: [id], onDelete: Cascade)
  issues      IssueLabel[]

  @@unique([projectId, name])
  @@map("labels")
}

model IssueLabel {
  id        String   @id @default(cuid())
  issueId   String   @map("issue_id")
  labelId   String   @map("label_id")
  createdAt DateTime @default(now()) @map("created_at")

  issue     Issue    @relation("IssueLabels", fields: [issueId], references: [id], onDelete: Cascade)
  label     Label    @relation("LabelIssues", fields: [labelId], references: [id], onDelete: Cascade)

  @@unique([issueId, labelId])
  @@map("issue_labels")
}
```

### 2. API Endpoints
All routes under `src/app/api/v3/projects/[[...route]]/route.ts` (or standard nesting):

**Label CRUD:**
- `GET /api/v3/orgs/:orgId/projects/:projectId/labels`
- `POST /api/v3/orgs/:orgId/projects/:projectId/labels` (Body: `ZLabelCreateInput`)
- `PATCH /api/v3/orgs/:orgId/projects/:projectId/labels/:labelId`
- `DELETE /api/v3/orgs/:orgId/projects/:projectId/labels/:labelId`

**Issue-Label Attachment:**
- `POST /api/v3/orgs/:orgId/projects/:projectId/issues/:issueId/labels` (Body: `{ labelId }`)
- `DELETE /api/v3/orgs/:orgId/projects/:projectId/issues/:issueId/labels/:labelId`

### 3. Service Layer & Auth
- **Labels Service** (`src/features/project/server/labels.service.ts` or standalone feature): CRUD logic handling Zod schemas.
- **Authorization (OpenFGA/ensureCan)**: Users require `read` access to Project to list labels. Users require `edit` access to Project/Issue to create/attach labels.

### 4. Frontend State
- Integrate label lists into the existing Zustand/Jotai cache.
- Incorporate into the `ZIssue` API responses so label tags render out-of-the-box.

---

## Open Questions for User
1. Next.js API Routes routing pattern requires nested routes. Do you prefer separating `route.ts` into individual folders like `api/v3/orgs/[[...route]]/route.ts` -> `.route('/orgs/:orgId/notifications', notificationHono)` or handling it in one giant Hono app? (I will assume registering sub-routers like `meHono`).
2. For emails, do you have an existing Queue built-in (e.g. BullMQ, Inngest) or should notifications be processed synchronously or via Vercel `after()` / `waitUntil`?

***Please review and approve the plan. Let me know if you would like me to proceed to EXECUTION.***
