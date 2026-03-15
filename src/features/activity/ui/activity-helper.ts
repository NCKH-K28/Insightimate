import type { ActivityEventWithActor, ActivityAction } from '@/contracts/activity';

// ==================== Types ====================

export type ActivityMessage = {
  /** Human-readable fragments for the activity sentence */
  fragments: MessageFragment[];
  /** The primary field that changed (for icon selection) */
  primaryField: string | null;
};

export type MessageFragment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'entity'; value: string; entityId?: string; entityType?: string }
  | { type: 'strikethrough'; value: string };

// ==================== Helpers ====================

const text = (value: string): MessageFragment => ({ type: 'text', value });
const bold = (value: string): MessageFragment => ({ type: 'bold', value });
const entity = (
  value: string,
  entityId?: string,
  entityType?: string,
): MessageFragment => ({ type: 'entity', value, entityId, entityType });
const strike = (value: string): MessageFragment => ({ type: 'strikethrough', value });

const ENTITY_LABELS: Record<string, string> = {
  PROJECT: 'project',
  ISSUE: 'issue',
  SPRINT: 'sprint',
  COMMENT: 'comment',
  TEAM: 'team',
  ORGANIZATION: 'organization',
};

function entityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType.toLowerCase();
}

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'None';
  return String(val);
}

function isEmptyValue(val: unknown): boolean {
  return val === null || val === undefined || val === '';
}

// ==================== Change field handlers ====================

export type ChangeEntry = {
  field: string;
  old?: unknown;
  new?: unknown;
  oldLabel?: string;
  newLabel?: string;
};

/**
 * Human-readable field name mapping.
 * Keys are the raw field names from the backend; values are display names.
 */
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  statusId: 'status',
  status: 'status',
  priorityId: 'priority',
  priority: 'priority',
  assigneeId: 'assignee',
  assignee: 'assignee',
  storyPoints: 'story points',
  story_points: 'story points',
  dueDate: 'due date',
  due_date: 'due date',
  startDate: 'start date',
  start_date: 'start date',
  summary: 'title',
  name: 'name',
  description: 'description',
  parentId: 'parent issue',
  parent_id: 'parent issue',
  sprintId: 'sprint',
  sprint_id: 'sprint',
  labelId: 'label',
  label: 'label',
  typeId: 'type',
  type: 'type',
  resolutionId: 'resolution',
  resolution: 'resolution',
  goal: 'goal',
  state: 'state',
};

function fieldDisplayName(field: string): string {
  return FIELD_DISPLAY_NAMES[field] ?? field.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

/**
 * Generate fragments for a single field change.
 */
function changeFragments(change: ChangeEntry): MessageFragment[] {
  const fieldName = fieldDisplayName(change.field);
  const oldVal = change.oldLabel ?? displayValue(change.old);
  const newVal = change.newLabel ?? displayValue(change.new);

  // Set → value (old was empty)
  if (isEmptyValue(change.old) && !isEmptyValue(change.new)) {
    return [
      text('set '),
      bold(fieldName),
      text(' to '),
      bold(newVal),
    ];
  }

  // Remove value (new is empty)
  if (!isEmptyValue(change.old) && isEmptyValue(change.new)) {
    return [
      text('removed '),
      bold(fieldName),
      text(' '),
      strike(oldVal),
    ];
  }

  // Changed from one value to another
  return [
    text('changed '),
    bold(fieldName),
    text(' from '),
    strike(oldVal),
    text(' to '),
    bold(newVal),
  ];
}

// ==================== Main message builder ====================

/**
 * Generate a human-readable activity message for a given event.
 *
 * Returns an array of `MessageFragment`s that can be rendered into
 * React nodes by the UI component.
 */
export function getActivityMessage(event: ActivityEventWithActor): ActivityMessage {
  const entityName = entityLabel(event.entity);
  const entityDisplay = event.entityTitle || event.entityKey || event.entityId;

  switch (event.action) {
    // ── CREATED ─────────────────────────────────────────────────────
    case 'CREATED':
      return {
        fragments: [
          text('created '),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: null,
      };

    // ── DELETED ─────────────────────────────────────────────────────
    case 'DELETED':
      return {
        fragments: [
          text('deleted '),
          text(`${entityName} `),
          bold(entityDisplay),
        ],
        primaryField: null,
      };

    // ── COMMENTED ───────────────────────────────────────────────────
    case 'COMMENTED':
      return {
        fragments: [
          text('commented on '),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: null,
      };

    // ── ASSIGNED ────────────────────────────────────────────────────
    case 'ASSIGNED': {
      const assigneeName = extractMetaValue(event, 'assigneeName', 'targetName');
      return {
        fragments: [
          text('assigned '),
          ...(assigneeName ? [bold(assigneeName), text(' to ')] : []),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: 'assignee',
      };
    }

    // ── UNASSIGNED ──────────────────────────────────────────────────
    case 'UNASSIGNED': {
      const removedName = extractMetaValue(event, 'assigneeName', 'targetName');
      return {
        fragments: [
          text('unassigned '),
          ...(removedName ? [bold(removedName), text(' from ')] : []),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: 'assignee',
      };
    }

    // ── MOVED ───────────────────────────────────────────────────────
    case 'MOVED': {
      const from = extractMetaValue(event, 'from', 'fromName');
      const to = extractMetaValue(event, 'to', 'toName');
      return {
        fragments: [
          text('moved '),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
          ...(from ? [text(' from '), bold(from)] : []),
          ...(to ? [text(' to '), bold(to)] : []),
        ],
        primaryField: null,
      };
    }

    // ── LOGGED_TIME ─────────────────────────────────────────────────
    case 'LOGGED_TIME': {
      const hours = extractMetaValue(event, 'hours', 'timeSpent');
      return {
        fragments: [
          text('logged '),
          ...(hours ? [bold(`${hours}h`), text(' on ')] : [text('time on ')]),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: null,
      };
    }

    // ── STATUS_CHANGED ──────────────────────────────────────────────
    case 'STATUS_CHANGED': {
      const changes = normalizeChanges(event.changes);
      const statusChange = changes.find(
        (c) => c.field === 'status' || c.field === 'statusId',
      );
      if (statusChange) {
        return {
          fragments: changeFragments(statusChange),
          primaryField: 'status',
        };
      }
      return {
        fragments: [
          text('changed status of '),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: 'status',
      };
    }

    // ── SPRINT_STARTED ──────────────────────────────────────────────
    case 'SPRINT_STARTED':
      return {
        fragments: [
          text('started sprint '),
          entity(entityDisplay, event.entityId, 'SPRINT'),
        ],
        primaryField: null,
      };

    // ── SPRINT_CLOSED ───────────────────────────────────────────────
    case 'SPRINT_CLOSED':
      return {
        fragments: [
          text('completed sprint '),
          entity(entityDisplay, event.entityId, 'SPRINT'),
        ],
        primaryField: null,
      };

    // ── MEMBER_ADDED ────────────────────────────────────────────────
    case 'MEMBER_ADDED': {
      const memberName = extractMetaValue(event, 'memberName', 'targetName');
      return {
        fragments: [
          text('added '),
          ...(memberName ? [bold(memberName), text(' to ')] : [text('a member to ')]),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: null,
      };
    }

    // ── MEMBER_REMOVED ──────────────────────────────────────────────
    case 'MEMBER_REMOVED': {
      const removedMember = extractMetaValue(event, 'memberName', 'targetName');
      return {
        fragments: [
          text('removed '),
          ...(removedMember ? [bold(removedMember), text(' from ')] : [text('a member from ')]),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: null,
      };
    }

    // ── ROLE_CHANGED ────────────────────────────────────────────────
    case 'ROLE_CHANGED': {
      const targetName = extractMetaValue(event, 'memberName', 'targetName');
      const newRole = extractMetaValue(event, 'role', 'newRole');
      return {
        fragments: [
          text('changed role of '),
          ...(targetName ? [bold(targetName)] : [text('a member')]),
          ...(newRole ? [text(' to '), bold(newRole)] : []),
          text(` in ${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: null,
      };
    }

    // ── UPDATED (catch-all with field-level detail) ─────────────────
    case 'UPDATED':
      return handleUpdated(event);

    // ── Fallback ────────────────────────────────────────────────────
    default:
      return {
        fragments: [
          text(`${(event.action as string).toLowerCase().replace(/_/g, ' ')} `),
          text(`${entityName} `),
          entity(entityDisplay, event.entityId, event.entity),
        ],
        primaryField: null,
      };
  }
}

// ==================== Specialized handlers ====================

function handleUpdated(event: ActivityEventWithActor): ActivityMessage {
  const entityName = entityLabel(event.entity);
  const entityDisplay = event.entityTitle || event.entityKey || event.entityId;
  const changes = normalizeChanges(event.changes);

  if (changes.length === 0) {
    return {
      fragments: [
        text('updated '),
        text(`${entityName} `),
        entity(entityDisplay, event.entityId, event.entity),
      ],
      primaryField: null,
    };
  }

  // Single change → inline sentence
  if (changes.length === 1) {
    const frags = changeFragments(changes[0]);
    return {
      fragments: [
        ...frags,
        text(` on ${entityName} `),
        entity(entityDisplay, event.entityId, event.entity),
      ],
      primaryField: changes[0].field,
    };
  }

  // Multiple changes → summary
  const fieldNames = changes
    .slice(0, 3)
    .map((c) => fieldDisplayName(c.field))
    .join(', ');
  const suffix = changes.length > 3 ? ` and ${changes.length - 3} more` : '';

  return {
    fragments: [
      text('updated '),
      bold(fieldNames + suffix),
      text(` on ${entityName} `),
      entity(entityDisplay, event.entityId, event.entity),
    ],
    primaryField: changes[0].field,
  };
}

// ==================== Utilities ====================

/**
 * Normalize the event.changes (which can be `any`) into a typed array.
 */
export function normalizeChanges(raw: unknown): ChangeEntry[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ChangeEntry[];

  // Handle object-form changes: { field: { old, new } }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, any>).map(([field, val]) => ({
      field,
      old: val?.old ?? val?.oldValue,
      new: val?.new ?? val?.newValue,
      oldLabel: val?.oldLabel,
      newLabel: val?.newLabel,
    }));
  }

  return [];
}

/**
 * Extract from event metadata or changes with fallback keys.
 */
function extractMetaValue(
  event: ActivityEventWithActor,
  ...keys: string[]
): string | null {
  const meta = event.metadata as Record<string, unknown> | null | undefined;
  if (meta) {
    for (const key of keys) {
      if (meta[key] != null) return String(meta[key]);
    }
  }

  // Also check changes for relevant field
  const changes = normalizeChanges(event.changes);
  for (const key of keys) {
    const change = changes.find((c) => c.field === key);
    if (change?.new != null) return displayValue(change.new);
  }

  return null;
}

/**
 * Get all individual change messages for an UPDATED event.
 * Used by the detail section to show itemised change lines.
 */
export function getChangeDetails(event: ActivityEventWithActor): {
  field: string;
  fragments: MessageFragment[];
}[] {
  const changes = normalizeChanges(event.changes);
  return changes.map((change) => ({
    field: change.field,
    fragments: changeFragments(change),
  }));
}
